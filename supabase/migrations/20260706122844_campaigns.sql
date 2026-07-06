-- Campaigns and membership (phase-1 campaign CRUD: create / invite-by-code / join).

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  game text not null default 'default',
  max_players int not null check (max_players > 0),
  creator_id uuid not null references auth.users (id) on delete cascade,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table campaign_members (
  campaign_id uuid not null references campaigns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

alter table campaigns enable row level security;
alter table campaign_members enable row level security;

-- Migrations applied via the CLI don't get the grants the Studio UI applies
-- automatically; RLS policies only take effect once the role can touch the
-- table at all.
grant select, insert, update on campaigns to authenticated;
grant select on campaign_members to authenticated;

-- campaigns and campaign_members each need to check membership/ownership on
-- the other table. A plain EXISTS subquery would re-trigger that table's RLS
-- policies, which reference campaigns/campaign_members right back — infinite
-- recursion. These SECURITY DEFINER helpers run as the (RLS-exempt) table
-- owner, so they read the raw table once and break the cycle.
create function is_campaign_member(p_campaign_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from campaign_members
    where campaign_id = p_campaign_id and user_id = p_user_id
  );
$$;

create function is_campaign_creator(p_campaign_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from campaigns
    where id = p_campaign_id and creator_id = p_user_id
  );
$$;

grant execute on function is_campaign_member(uuid, uuid) to authenticated;
grant execute on function is_campaign_creator(uuid, uuid) to authenticated;

-- A user can see a campaign once they belong to it (creator or joined member).
create policy campaigns_select_member on campaigns
  for select
  using (
    creator_id = auth.uid()
    or is_campaign_member(id, auth.uid())
  );

create policy campaigns_insert_self on campaigns
  for insert
  with check (creator_id = auth.uid());

-- Only the creator can rename/regenerate the invite code for now (no delegated
-- invite permissions in phase 1).
create policy campaigns_update_creator on campaigns
  for update
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

-- Members of a campaign (or its creator) can see the rest of the roster.
create policy campaign_members_select_member on campaign_members
  for select
  using (
    user_id = auth.uid()
    or is_campaign_creator(campaign_id, auth.uid())
    or is_campaign_member(campaign_id, auth.uid())
  );

-- Membership rows are only ever written by the trigger below or the
-- join_campaign() function, both SECURITY DEFINER, so no insert/update/delete
-- policy is needed for campaign_members.

create function handle_new_campaign()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into campaign_members (campaign_id, user_id)
  values (new.id, new.creator_id);
  return new;
end;
$$;

create trigger on_campaign_created
  after insert on campaigns
  for each row
  execute function handle_new_campaign();

-- Joining by invite code is exposed as an RPC (rather than a direct insert)
-- so we can enforce the max_players cap and keep it idempotent for a user
-- who already joined.
create function join_campaign(p_code text)
returns campaigns
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign campaigns;
  v_member_count int;
begin
  select * into v_campaign from campaigns where invite_code = p_code;

  if not found then
    raise exception 'INVALID_CODE';
  end if;

  if exists (
    select 1 from campaign_members
    where campaign_id = v_campaign.id and user_id = auth.uid()
  ) then
    return v_campaign;
  end if;

  select count(*) into v_member_count
  from campaign_members
  where campaign_id = v_campaign.id;

  if v_member_count >= v_campaign.max_players then
    raise exception 'CAMPAIGN_FULL';
  end if;

  insert into campaign_members (campaign_id, user_id)
  values (v_campaign.id, auth.uid());

  return v_campaign;
end;
$$;

grant execute on function join_campaign(text) to authenticated;
