-- Adventures (Aventura): belong to one campaign. Only the campaign creator
-- can create/edit/delete adventures for now (no delegated invite/management
-- permissions yet, same rule as campaign invites). required_players <= the
-- campaign's max_players is enforced in the server action (cross-table
-- checks aren't expressible as a CHECK constraint), same pattern as the
-- campaign's max_players-vs-global-limit validation.
--
-- There's no master_user_id here: the master isn't fixed at adventure
-- creation. It's resolved dynamically each time a session starts, by
-- whichever lobby participant readies up with a master-type sheet (see the
-- sessions migration).

create table adventures (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  required_players int not null check (required_players > 0),
  created_at timestamptz not null default now()
);

alter table adventures enable row level security;

grant select, insert, update, delete on adventures to authenticated;

create policy adventures_select_member on adventures
  for select
  using (is_campaign_member(campaign_id, auth.uid()));

create policy adventures_insert_campaign_creator on adventures
  for insert
  with check (
    exists (
      select 1 from campaigns c
      where c.id = adventures.campaign_id and c.creator_id = auth.uid()
    )
  );

create policy adventures_update_campaign_creator on adventures
  for update
  using (
    exists (
      select 1 from campaigns c
      where c.id = adventures.campaign_id and c.creator_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from campaigns c
      where c.id = adventures.campaign_id and c.creator_id = auth.uid()
    )
  );

create policy adventures_delete_campaign_creator on adventures
  for delete
  using (
    exists (
      select 1 from campaigns c
      where c.id = adventures.campaign_id and c.creator_id = auth.uid()
    )
  );
