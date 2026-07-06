@AGENTS.md

# RoleMe

Web app for organizing live tabletop RPG sessions: campaigns, adventures, character sheets, shared dice rolling, restricted document sharing (future phase). Mobile-visible (PWA), i18n-ready.

This project is fully independent from any other project on this machine — do not mix in context, config, or conventions from unrelated repos.

## Conventions

- All code (identifiers, comments, commit messages) in English, even though design discussions happen in Spanish. The Data model section below uses Spanish domain nouns (Campaña, Ficha, Juego...) because that's the product vocabulary — actual tables/columns/variables must use their English translation. Canonical glossary so this doesn't drift:
  - Campaña → campaign, Aventura → adventure, Sesión → session, Ficha → sheet, Juego → game
  - max_jugadores → max_players, visible en tarjeta → visible_on_card
  - estadísticas → stats, información de personaje → character_info, estado de personaje → character_state
  - If a new domain term needs translating and it's not in this list, ask rather than guessing — add the answer here once settled.
- i18n via next-intl from day one. Currently only Spanish (`es`) ships, no hardcoded user-facing strings — everything goes through `src/messages/es.json` translation keys (translation *keys* are English identifiers too; only the Spanish text values live in the JSON). Content stored in the DB (e.g. a campaign's name, or a game field's display `label`) is just data, not UI chrome, so it isn't routed through translation keys — it's typed directly (in Spanish, for now, since that's the only audience).

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4
- next-intl (single locale for now, no URL-based locale routing yet — add it if/when a second locale ships)
- Supabase (Postgres + Auth + Realtime + Storage + Row Level Security); anonymous auth by default, with a nudge to link an email once a user joins a campaign (campaigns can span weeks, unlike a single live session where device-bound anonymous identity is fine)
- Package name: `roleme-web` (npm)

## Data model (phase 1)

- **Campaña** (`campaigns` table): name (required), single `game` (ruleset — fixed for the whole campaign, no mixing systems across its adventures), `max_players` (≤ a global limit read from config, default 24). Only the creator can invite (via code/link) and create adventures for now (no delegated invite permissions yet).
- **Juego** (ruleset; `games` + `game_fields` tables): stored in the DB, not a config file — future games are inserted rows, and future calculated/derived fields (deferred) can extend `game_fields` without a file-to-DB migration. Phase 1 ships a single seeded `default` game, read-only (no editor UI). Personaje fichas' three field groups (`stats`, `character_info`, `character_state`) are fixed by the Ficha model itself; `game_fields` defines which fields exist within each group per game, plus each field's `type` (`number`/`text`/`textarea`) and `default_visible_on_card`.
- **Aventura**: belongs to one Campaña, name (required), description (optional), `max_players` (≤ campaign's limit), has its own master — different adventures in the same campaign can have different masters.
- **Sesión**: one live "game night" instance of an Aventura; only one `ACTIVA` session per adventure at a time. States: `PREPARACION` → `ACTIVA` → `FINALIZADA` (no `PAUSADA` — deliberately dropped for phase 1 along with pause-consensus/turn-locking mechanics; may return in a later phase). Turn order is a master-editable reference list only, not enforced/blocking. Closes manually (only by whoever created it) or automatically when everyone disconnects (use Supabase Realtime Presence with a grace period to avoid false positives). Reconnection is automatic via user identity + campaign membership — no per-session join codes needed.
- **Ficha** (sheet): belongs to a Campaña (reusable across that campaign's adventures, not tied to a single one), type `character` or `master`. Character sheets have three field groups — stats, character info, character state — each field independently flagged `visible_on_card` (visibility is orthogonal to the group). Master sheets have no fields of their own yet. JSON export/import only applies to `character` sheets. A user can't be master and player at once (phase-1 simplification). Visibility: owner sees full sheet; master sees all sheets in full; everyone else sees only the public "card" fields.
- **Dice tool**: decoupled/reusable component — free numeric face-count input + quick presets (d4/d6/d8/d10/d12/d20/d100), quantity (default 1). Public by default inside an active session; only the master can mark a roll private; rolls are logged against the session.

Deferred to later phases (not discarded): importable rules engine / auto-calculated rolls, delegated invite permissions, documents/maps with granular visibility, enforced/blocking turn order, multi-system campaigns, character portrait image upload (for personaje fichas).

## Phase-1 backlog

1. [done] Repo structure + Supabase local project + frontend skeleton
2. [done] Anonymous auth + optional email linking
3. [done] Campaña CRUD (create / invite-by-code / join)
4. [done] Fixed "default" game schema (stats/fields/state, no editor UI yet)
5. [ ] Ficha CRUD (personaje + master) + JSON export/import
6. [ ] Visibility rules (own ficha / public card / master view)
7. [ ] Aventura CRUD
8. [ ] Sesión (preparation → active → close)
9. [ ] Dice tool + session integration
10. [ ] Set up real/hosted Supabase environment (supabase.com project) and fill in `.env.local` — deferred until the rest of phase 1 is validated against local Supabase (Docker)

## Known environment notes

- Node is 20.17.0 locally; some deps want `^20.19.0 || ^22.13.0 || >=24` (EBADENGINE warning only, not currently fatal).
- Next.js 16 renamed `middleware.ts` to `proxy.ts` (deprecated, not removed) — relevant once auth/session interception is needed.
- No hosted Supabase project exists yet — creating one on supabase.com requires the user's own account, done manually; then fill in `.env.local` from `.env.local.example`.

## Working preferences

- Always confirm before making changes that go beyond what was explicitly asked.
- Never commit unless explicitly asked to.
