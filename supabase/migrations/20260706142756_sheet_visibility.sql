-- Visibility rules for sheets: owner sees their own sheet in full (already
-- covered by sheets_owner / sheet_field_values_owner from the previous
-- migration); this adds the other two views:
--   - master (owns a 'master'-type sheet in the campaign) sees every sheet
--     in that campaign in full
--   - everyone else in the campaign sees only the fields flagged
--     visible_on_card on other members' sheets
--
-- "Master" here is derived purely from Ficha data (a user owning a
-- master-type sheet in the campaign), not from Aventura — Aventura doesn't
-- exist yet (a later task), and the data model already treats a master sheet
-- as the campaign-wide marker of "this user is a master here".

create function is_campaign_master(p_campaign_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from sheets
    where campaign_id = p_campaign_id
      and owner_id = p_user_id
      and type = 'master'
  );
$$;

grant execute on function is_campaign_master(uuid, uuid) to authenticated;

-- The sheet row itself (name/type/owner) isn't sensitive — any campaign
-- member can see whose sheets exist. What's actually gated is the field
-- *values*, via the two sheet_field_values policies below. This one policy
-- covers both "master sees all sheets" and "everyone sees the public card"
-- at the sheets-row level, since a master is a campaign member too.
create policy sheets_select_member on sheets
  for select
  using (is_campaign_member(campaign_id, auth.uid()));

create policy sheet_field_values_select_master on sheet_field_values
  for select
  using (
    exists (
      select 1 from sheets s
      where s.id = sheet_field_values.sheet_id
        and is_campaign_master(s.campaign_id, auth.uid())
    )
  );

create policy sheet_field_values_select_public_card on sheet_field_values
  for select
  using (
    visible_on_card = true
    and exists (
      select 1 from sheets s
      where s.id = sheet_field_values.sheet_id
        and is_campaign_member(s.campaign_id, auth.uid())
    )
  );
