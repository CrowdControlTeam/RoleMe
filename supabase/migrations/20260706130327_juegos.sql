-- Juegos (rulesets) and their fixed field schema for Personaje fichas.
-- Phase 1 ships a single "default" juego with no editor UI; storing it in
-- relational tables (rather than a static config file) means future juegos
-- are just inserted rows, and future calculated fields (deferred) can hang
-- an extra column/table off juego_campos without a file-to-DB migration.

create table juegos (
  id text primary key check (id ~ '^[a-z0-9_]+$'),
  name text not null,
  created_at timestamptz not null default now()
);

-- The three field groups are a fixed part of the Ficha model itself (not
-- configurable per juego); what varies per juego is which fields exist
-- within each group.
create table juego_campos (
  id uuid primary key default gen_random_uuid(),
  juego_id text not null references juegos (id) on delete cascade,
  "group" text not null check (
    "group" in ('estadisticas', 'informacion_personaje', 'estado_personaje')
  ),
  key text not null check (key ~ '^[a-z0-9_]+$'),
  label text not null,
  type text not null check (type in ('number', 'text', 'textarea')),
  default_visible_en_tarjeta boolean not null default true,
  sort_order int not null default 0,
  unique (juego_id, "group", key)
);

alter table juegos enable row level security;
alter table juego_campos enable row level security;

-- Reference data: readable by anyone with an account (including anonymous
-- sessions), never written to directly since there's no editor UI yet.
create policy juegos_select_all on juegos for select using (true);
create policy juego_campos_select_all on juego_campos for select using (true);

grant select on juegos to authenticated;
grant select on juego_campos to authenticated;

-- The juego picker on the campaña creation form must render before a visitor
-- has any session (anonymous sign-in only happens on submit), so the juegos
-- catalog (just id/name) is also readable by the unauthenticated anon role.
-- juego_campos (the actual field definitions) stays authenticated-only since
-- it's only needed once a user already has a session via campaign membership.
grant select on juegos to anon;

alter table campanas
  add constraint campanas_juego_fkey foreign key (juego) references juegos (id);

insert into juegos (id, name) values ('default', 'Default');

insert into juego_campos (juego_id, "group", key, label, type, default_visible_en_tarjeta, sort_order)
values
  -- Estadísticas
  ('default', 'estadisticas', 'fuerza', 'Fuerza', 'number', true, 1),
  ('default', 'estadisticas', 'destreza', 'Destreza', 'number', true, 2),
  ('default', 'estadisticas', 'constitucion', 'Constitución', 'number', true, 3),
  ('default', 'estadisticas', 'inteligencia', 'Inteligencia', 'number', true, 4),
  ('default', 'estadisticas', 'sabiduria', 'Sabiduría', 'number', true, 5),
  ('default', 'estadisticas', 'carisma', 'Carisma', 'number', true, 6),

  -- Información de personaje
  ('default', 'informacion_personaje', 'nombre', 'Nombre', 'text', true, 1),
  ('default', 'informacion_personaje', 'edad', 'Edad', 'number', true, 2),
  ('default', 'informacion_personaje', 'raza', 'Raza/Estirpe', 'text', true, 3),
  ('default', 'informacion_personaje', 'clase', 'Clase/Rol', 'text', true, 4),
  ('default', 'informacion_personaje', 'trasfondo', 'Trasfondo', 'textarea', true, 5),

  -- Estado de personaje
  ('default', 'estado_personaje', 'puntos_golpe_actuales', 'Puntos de golpe actuales', 'number', true, 1),
  ('default', 'estado_personaje', 'puntos_golpe_maximos', 'Puntos de golpe máximos', 'number', true, 2),
  ('default', 'estado_personaje', 'condiciones', 'Condiciones/Estado', 'text', true, 3),
  ('default', 'estado_personaje', 'notas_privadas', 'Notas privadas', 'textarea', false, 4);
