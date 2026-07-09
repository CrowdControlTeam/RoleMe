-- Two deferred phase-1 pieces for Sesión:
--
-- 1. Auto-close on everyone-disconnected. True Realtime Presence can't
--    reliably close a session when its *last* participant disconnects (no
--    one would be left subscribed to react), and standing up a persistent
--    server-side subscriber is real new infrastructure this project doesn't
--    have. Instead: participants heartbeat every ~30s while the session
--    page is open; loading an active session's page (by anyone, any time
--    later) lazily checks whether every participant has gone stale past the
--    grace period and closes it then. Not instant, but self-healing with no
--    background worker.
--
-- 2. Master-editable turn order: a plain ordered list of participant user
--    ids, purely a reference — nothing enforces or blocks on it. Seeded
--    from join order the moment a session goes active.

alter table session_participants add column last_seen_at timestamptz not null default now();
alter table sessions add column turn_order uuid[] not null default '{}';

-- The master (not necessarily the session's creator) can reorder turn_order.
-- This does grant the master general UPDATE on sessions (RLS can't scope a
-- policy to a single column) — acceptable here since neither capability
-- (master adjusting turn order, creator closing early) is sensitive enough
-- to need strict separation.
create policy sessions_update_master on sessions
  for update
  using (is_session_master(id, auth.uid()))
  with check (is_session_master(id, auth.uid()));

create function heartbeat(p_session_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update session_participants
  set last_seen_at = now()
  where session_id = p_session_id and user_id = auth.uid();
$$;

grant execute on function heartbeat(uuid) to authenticated;

create function close_if_abandoned_session(p_session_id uuid, p_grace_seconds int default 120)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_abandoned boolean;
begin
  select status into v_status from sessions where id = p_session_id;

  if v_status is distinct from 'active' then
    return;
  end if;

  select
    count(*) > 0
    and bool_and(last_seen_at < now() - make_interval(secs => p_grace_seconds))
  into v_abandoned
  from session_participants
  where session_id = p_session_id;

  if v_abandoned then
    update sessions set status = 'finished', ended_at = now() where id = p_session_id;
  end if;
end;
$$;

grant execute on function close_if_abandoned_session(uuid, int) to authenticated;

-- Re-defined (not re-created) so the preparing->active transition also
-- seeds turn_order from join order at that moment.
create or replace function maybe_start_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session sessions;
  v_adventure adventures;
  v_participant_count int;
  v_ready_count int;
  v_master_ready_count int;
begin
  select * into v_session from sessions where id = new.session_id;

  if v_session.status <> 'preparing' then
    return new;
  end if;

  select * into v_adventure from adventures where id = v_session.adventure_id;

  select count(*) into v_participant_count
  from session_participants
  where session_id = v_session.id;

  select count(*) into v_ready_count
  from session_participants
  where session_id = v_session.id and ready = true and sheet_id is not null;

  select count(*) into v_master_ready_count
  from session_participants sp
  join sheets s on s.id = sp.sheet_id
  where sp.session_id = v_session.id and sp.ready = true and s.type = 'master';

  if v_participant_count = v_adventure.required_players
    and v_ready_count = v_adventure.required_players
    and v_master_ready_count = 1
  then
    update sessions
    set status = 'active',
        started_at = now(),
        turn_order = (
          select coalesce(array_agg(user_id order by joined_at), '{}')
          from session_participants
          where session_id = v_session.id
        )
    where id = v_session.id;
  end if;

  return new;
end;
$$;
