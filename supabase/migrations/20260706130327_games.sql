-- Games (rulesets) and their fixed field schema for character sheets.
-- Phase 1 ships a single "default" game with no editor UI; storing it in
-- relational tables (rather than a static config file) means future games
-- are just inserted rows, and future calculated fields (deferred) can hang
-- an extra column/table off game_fields without a file-to-DB migration.

create table games (
  id text primary key check (id ~ '^[a-z0-9_]+$'),
  name text not null,
  created_at timestamptz not null default now()
);

-- The three field groups are a fixed part of the character sheet model
-- itself (not configurable per game); what varies per game is which fields
-- exist within each group.
create table game_fields (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references games (id) on delete cascade,
  "group" text not null check (
    "group" in ('stats', 'character_info', 'character_state')
  ),
  key text not null check (key ~ '^[a-z0-9_]+$'),
  label text not null,
  type text not null check (type in ('number', 'text', 'textarea')),
  default_visible_on_card boolean not null default true,
  sort_order int not null default 0,
  unique (game_id, "group", key)
);

alter table games enable row level security;
alter table game_fields enable row level security;

-- Reference data: readable by anyone with an account (including anonymous
-- sessions), never written to directly since there's no editor UI yet.
create policy games_select_all on games for select using (true);
create policy game_fields_select_all on game_fields for select using (true);

grant select on games to authenticated;
grant select on game_fields to authenticated;

-- The game picker on the campaign creation form must render before a visitor
-- has any session (anonymous sign-in only happens on submit), so the games
-- catalog (just id/name) is also readable by the unauthenticated anon role.
-- game_fields (the actual field definitions) stays authenticated-only since
-- it's only needed once a user already has a session via campaign membership.
grant select on games to anon;

alter table campaigns
  add constraint campaigns_game_fkey foreign key (game) references games (id);

insert into games (id, name) values ('default', 'Default');

insert into game_fields (game_id, "group", key, label, type, default_visible_on_card, sort_order)
values
  -- Estadísticas
  ('default', 'stats', 'strength', 'Fuerza', 'number', true, 1),
  ('default', 'stats', 'dexterity', 'Destreza', 'number', true, 2),
  ('default', 'stats', 'constitution', 'Constitución', 'number', true, 3),
  ('default', 'stats', 'intelligence', 'Inteligencia', 'number', true, 4),
  ('default', 'stats', 'wisdom', 'Sabiduría', 'number', true, 5),
  ('default', 'stats', 'charisma', 'Carisma', 'number', true, 6),

  -- Información de personaje
  ('default', 'character_info', 'name', 'Nombre', 'text', true, 1),
  ('default', 'character_info', 'age', 'Edad', 'number', true, 2),
  ('default', 'character_info', 'race', 'Raza/Estirpe', 'text', true, 3),
  ('default', 'character_info', 'class', 'Clase/Rol', 'text', true, 4),
  ('default', 'character_info', 'background', 'Trasfondo', 'textarea', true, 5),

  -- Estado de personaje
  ('default', 'character_state', 'current_hit_points', 'Puntos de golpe actuales', 'number', true, 1),
  ('default', 'character_state', 'max_hit_points', 'Puntos de golpe máximos', 'number', true, 2),
  ('default', 'character_state', 'conditions', 'Condiciones/Estado', 'text', true, 3),
  ('default', 'character_state', 'private_notes', 'Notas privadas', 'textarea', false, 4);
