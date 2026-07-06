-- Sessions (Sesión): a lobby ("preparing") that becomes "active" once
-- everyone required has joined, picked a sheet, and readied up, with
-- exactly one of them on a master-type sheet. "finished" is set manually
-- (by whoever created the session) for now — auto-closing on
-- everyone-disconnected (Realtime Presence) is a separate, later task.

create table sessions (
  id uuid primary key default gen_random_uuid(),
  adventure_id uuid not null references adventures (id) on delete cascade,
  -- Denormalized from adventures.campaign_id so RLS here doesn't need a
  -- second join through adventures on every check; kept in sync by the
  -- BEFORE INSERT trigger below.
  campaign_id uuid not null references campaigns (id) on delete cascade,
  status text not null default 'preparing' check (status in ('preparing', 'active', 'finished')),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

-- Only one open (preparing/active) session per adventure at a time.
create unique index sessions_one_open_per_adventure
  on sessions (adventure_id)
  where status in ('preparing', 'active');

create function set_session_campaign_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select campaign_id into new.campaign_id from adventures where id = new.adventure_id;
  return new;
end;
$$;

create trigger set_session_campaign_id_trigger
  before insert on sessions
  for each row
  execute function set_session_campaign_id();

alter table sessions enable row level security;
grant select, insert, update on sessions to authenticated;

create policy sessions_select_member on sessions
  for select
  using (is_campaign_member(campaign_id, auth.uid()));

create policy sessions_insert_member on sessions
  for insert
  with check (is_campaign_member(campaign_id, auth.uid()));

-- Manual close (or any other edit) by whoever opened the lobby. The
-- automatic preparing->active transition below runs as SECURITY DEFINER and
-- isn't affected by this policy.
create policy sessions_update_creator on sessions
  for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- The lobby roster: one row per user per session. sheet_id is the sheet
-- they've picked (or NULL if still deciding); ready locks it in.
create table session_participants (
  session_id uuid not null references sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  sheet_id uuid references sheets (id) on delete set null,
  ready boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

-- A sheet can only be claimed by one participant in a given lobby.
create unique index session_participants_unique_sheet
  on session_participants (session_id, sheet_id)
  where sheet_id is not null;

create function check_participant_sheet_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sheet_id is not null then
    if not exists (
      select 1 from sheets where id = new.sheet_id and owner_id = new.user_id
    ) then
      raise exception 'SHEET_NOT_OWNED';
    end if;
  end if;
  return new;
end;
$$;

create trigger check_session_participant_sheet
  before insert or update on session_participants
  for each row
  execute function check_participant_sheet_ownership();

-- After every join/pick/ready change, check whether the lobby is complete:
-- exactly required_players participants, all ready with a sheet, and
-- exactly one of those sheets is a master sheet. If so, the session starts.
create function maybe_start_session()
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
    update sessions set status = 'active', started_at = now() where id = v_session.id;
  end if;

  return new;
end;
$$;

create trigger on_session_participant_change
  after insert or update on session_participants
  for each row
  execute function maybe_start_session();

alter table session_participants enable row level security;
grant select, insert, update, delete on session_participants to authenticated;

create policy session_participants_select_member on session_participants
  for select
  using (
    exists (
      select 1 from sessions s
      where s.id = session_participants.session_id
        and is_campaign_member(s.campaign_id, auth.uid())
    )
  );

create policy session_participants_insert_self on session_participants
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from sessions s
      where s.id = session_participants.session_id
        and s.status = 'preparing'
        and is_campaign_member(s.campaign_id, auth.uid())
    )
  );

create policy session_participants_update_self on session_participants
  for update
  using (
    user_id = auth.uid()
    and exists (
      select 1 from sessions s
      where s.id = session_participants.session_id and s.status = 'preparing'
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from sessions s
      where s.id = session_participants.session_id and s.status = 'preparing'
    )
  );

create policy session_participants_delete_self on session_participants
  for delete
  using (
    user_id = auth.uid()
    and exists (
      select 1 from sessions s
      where s.id = session_participants.session_id and s.status = 'preparing'
    )
  );
