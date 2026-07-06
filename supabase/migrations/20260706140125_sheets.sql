-- Sheets (Ficha): character or master, phase-1 CRUD only. Visibility beyond
-- "owner sees their own sheet in full" (master sees all, others see the
-- public card) is a separate deferred task — RLS here is owner-only.

create table sheets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('character', 'master')),
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

-- One row per game_field the sheet has a value for. Master sheets get no
-- rows here (they have no fields of their own yet).
create table sheet_field_values (
  sheet_id uuid not null references sheets (id) on delete cascade,
  game_field_id uuid not null references game_fields (id) on delete cascade,
  value text,
  visible_on_card boolean not null default true,
  primary key (sheet_id, game_field_id)
);

alter table sheets enable row level security;
alter table sheet_field_values enable row level security;

grant select, insert, update, delete on sheets to authenticated;
grant select, insert, update, delete on sheet_field_values to authenticated;

-- Owner-only for phase 1. A campaign member (not just the creator) can create
-- a sheet in that campaign.
create policy sheets_owner on sheets
  for all
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and is_campaign_member(campaign_id, auth.uid())
  );

-- No cross-reference back to sheets from sheets' own policy above, so a plain
-- EXISTS subquery here doesn't risk the recursion campaigns/campaign_members
-- had to work around.
create policy sheet_field_values_owner on sheet_field_values
  for all
  using (
    exists (
      select 1 from sheets s
      where s.id = sheet_field_values.sheet_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from sheets s
      where s.id = sheet_field_values.sheet_id and s.owner_id = auth.uid()
    )
  );

-- New character sheets start with one (empty) value row per field defined by
-- the campaign's game, pre-seeded with that field's default visibility.
create function handle_new_sheet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type = 'character' then
    insert into sheet_field_values (sheet_id, game_field_id, visible_on_card)
    select new.id, gf.id, gf.default_visible_on_card
    from game_fields gf
    join campaigns c on c.id = new.campaign_id
    where gf.game_id = c.game;
  end if;
  return new;
end;
$$;

create trigger on_sheet_created
  after insert on sheets
  for each row
  execute function handle_new_sheet();
