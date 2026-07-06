-- Campañas and membership (phase-1 Campaña CRUD: create / invite-by-code / join).

create table campanas (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  juego text not null default 'default',
  max_jugadores int not null check (max_jugadores > 0),
  creator_id uuid not null references auth.users (id) on delete cascade,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table campana_miembros (
  campana_id uuid not null references campanas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (campana_id, user_id)
);

alter table campanas enable row level security;
alter table campana_miembros enable row level security;

-- Migrations applied via the CLI don't get the grants the Studio UI applies
-- automatically; RLS policies only take effect once the role can touch the
-- table at all.
grant select, insert, update on campanas to authenticated;
grant select on campana_miembros to authenticated;

-- campanas and campana_miembros each need to check membership/ownership on the
-- other table. A plain EXISTS subquery would re-trigger that table's RLS
-- policies, which reference campanas/campana_miembros right back — infinite
-- recursion. These SECURITY DEFINER helpers run as the (RLS-exempt) table
-- owner, so they read the raw table once and break the cycle.
create function is_campana_member(p_campana_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from campana_miembros
    where campana_id = p_campana_id and user_id = p_user_id
  );
$$;

create function is_campana_creator(p_campana_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from campanas
    where id = p_campana_id and creator_id = p_user_id
  );
$$;

grant execute on function is_campana_member(uuid, uuid) to authenticated;
grant execute on function is_campana_creator(uuid, uuid) to authenticated;

-- A user can see a campaña once they belong to it (creator or joined member).
create policy campanas_select_member on campanas
  for select
  using (
    creator_id = auth.uid()
    or is_campana_member(id, auth.uid())
  );

create policy campanas_insert_self on campanas
  for insert
  with check (creator_id = auth.uid());

-- Only the creator can rename/regenerate the invite code for now (no delegated
-- invite permissions in phase 1).
create policy campanas_update_creator on campanas
  for update
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

-- Members of a campaña (or its creator) can see the rest of the roster.
create policy campana_miembros_select_member on campana_miembros
  for select
  using (
    user_id = auth.uid()
    or is_campana_creator(campana_id, auth.uid())
    or is_campana_member(campana_id, auth.uid())
  );

-- Membership rows are only ever written by the trigger below or the
-- join_campana() function, both SECURITY DEFINER, so no insert/update/delete
-- policy is needed for campana_miembros.

create function handle_new_campana()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into campana_miembros (campana_id, user_id)
  values (new.id, new.creator_id);
  return new;
end;
$$;

create trigger on_campana_created
  after insert on campanas
  for each row
  execute function handle_new_campana();

-- Joining by invite code is exposed as an RPC (rather than a direct insert)
-- so we can enforce the max_jugadores cap and keep it idempotent for a user
-- who already joined.
create function join_campana(p_code text)
returns campanas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campana campanas;
  v_member_count int;
begin
  select * into v_campana from campanas where invite_code = p_code;

  if not found then
    raise exception 'CODIGO_INVALIDO';
  end if;

  if exists (
    select 1 from campana_miembros
    where campana_id = v_campana.id and user_id = auth.uid()
  ) then
    return v_campana;
  end if;

  select count(*) into v_member_count
  from campana_miembros
  where campana_id = v_campana.id;

  if v_member_count >= v_campana.max_jugadores then
    raise exception 'CAMPANA_LLENA';
  end if;

  insert into campana_miembros (campana_id, user_id)
  values (v_campana.id, auth.uid());

  return v_campana;
end;
$$;

grant execute on function join_campana(text) to authenticated;
