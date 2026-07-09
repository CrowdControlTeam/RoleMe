-- Dice tool: rolls are logged against a session. Public by default; only
-- the session's master (the participant whose readied sheet is master-type
-- — same definition used for the lobby's auto-start check) can mark a roll
-- private. Rolling only makes sense once the game has actually started.

create function is_session_master(p_session_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from session_participants sp
    join sheets s on s.id = sp.sheet_id
    where sp.session_id = p_session_id
      and sp.user_id = p_user_id
      and sp.ready = true
      and s.type = 'master'
  );
$$;

grant execute on function is_session_master(uuid, uuid) to authenticated;

create table dice_rolls (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  faces int not null check (faces >= 2),
  quantity int not null check (quantity between 1 and 100),
  modifier int not null default 0 check (modifier between -1000 and 1000),
  results jsonb not null,
  total int not null,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

alter table dice_rolls enable row level security;
grant select, insert on dice_rolls to authenticated;

-- Public rolls: visible to any participant of that session. Private rolls:
-- visible only to whoever rolled them and to the session's master.
create policy dice_rolls_select on dice_rolls
  for select
  using (
    (
      is_private = false
      and exists (
        select 1 from session_participants sp
        where sp.session_id = dice_rolls.session_id and sp.user_id = auth.uid()
      )
    )
    or user_id = auth.uid()
    or is_session_master(session_id, auth.uid())
  );

create policy dice_rolls_insert_participant on dice_rolls
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from session_participants sp
      where sp.session_id = dice_rolls.session_id and sp.user_id = auth.uid()
    )
    and exists (
      select 1 from sessions s
      where s.id = dice_rolls.session_id and s.status = 'active'
    )
    and (is_private = false or is_session_master(session_id, auth.uid()))
  );
