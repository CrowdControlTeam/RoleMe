-- Adventures (Aventura): belong to one campaign, have their own master —
-- different adventures in the same campaign can have different masters.
-- Only the campaign creator can create/edit/delete adventures for now (no
-- delegated invite/management permissions yet, same rule as campaign
-- invites). max_players <= the campaign's max_players is enforced in the
-- server action (cross-table checks aren't expressible as a CHECK
-- constraint), same pattern as the campaign's max_players-vs-global-limit
-- validation.

create table adventures (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  max_players int not null check (max_players > 0),
  master_user_id uuid not null references auth.users (id) on delete restrict,
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
