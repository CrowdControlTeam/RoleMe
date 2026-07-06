@AGENTS.md

# RoleMe

Web app for organizing live tabletop RPG sessions: campaigns, adventures, character sheets, shared dice rolling, restricted document sharing (future phase). Mobile-visible (PWA), i18n-ready.

This project is fully independent from any other project on this machine — do not mix in context, config, or conventions from unrelated repos.

## Conventions

- All code (identifiers, comments, commit messages) in English, even though design discussions happen in Spanish. The Data model section below uses Spanish domain nouns (Campaña, Ficha, Juego...) because that's the product vocabulary — actual tables/columns/variables must use their English translation. Canonical glossary so this doesn't drift:
  - Campaña → campaign, Aventura → adventure, Sesión → session, Ficha → sheet, Juego → game
  - max_jugadores → max_players, visible en tarjeta → visible_on_card
  - estadísticas → stats, información de personaje → character_info, estado de personaje → character_state
  - PREPARACION/ACTIVA/FINALIZADA (Sesión states) → preparing/active/finished, Listo → ready
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
- **Aventura** (`adventures` table): belongs to one Campaña, name (required), description (optional), `required_players` — the exact headcount needed for its lobby to start, not a cap (≤ campaign's `max_players`, validated in the server action — cross-table CHECK constraints aren't a thing in Postgres). No fixed master field: the master isn't chosen at adventure creation, it's resolved fresh each time a session starts (see Sesión). Only the campaign creator can create/edit/delete adventures (same rule as campaign invites); any campaign member can view them and start a session.
- **Sesión** (`sessions` + `session_participants` tables): one instance of an Aventura being played. States: `preparing` (lobby) → `active` → `finished`. Only one `preparing`/`active` session per adventure at a time (partial unique index). Any campaign member can open the lobby. In the lobby each participant picks (or creates) one of their **own** sheets — never another member's — and toggles ready; readying up locks that sheet's `stats`+`character_info` groups (read-only, enforced both in the UI and by `updateSheetStatsInfo`'s server-side lock check) until the session reaches `finished`, while `character_state` stays editable throughout since that's the group meant to change during play. A BEFORE trigger blocks picking a sheet you don't own or swapping sheets while still readied; an AFTER trigger auto-flips `preparing` → `active` once participant count = `required_players`, all are ready, and exactly one readied sheet is `master`-type (0 or 2+ blocks the start with an in-lobby warning, doesn't restrict the ready button itself). `finished` is currently only set manually by whoever opened the lobby — automatic closing when everyone disconnects (Realtime Presence) is **not implemented yet**, deferred along with dice-tool/session integration (phase-1 backlog item 9). Turn order (master-editable reference list, not enforced/blocking) is also not implemented yet.
- **Ficha** (sheet; `sheets` + `sheet_field_values` tables): belongs to a Campaña (reusable across that campaign's adventures, not tied to a single one), type `character` or `master`; a user can own several sheets in the same campaign (no uniqueness constraint) — a user can't play as master and character at once, but that's enforced at session-lobby time (only one readied sheet may be `master`-type), not at sheet-creation time. Character sheets get one `sheet_field_values` row per `game_field` of the campaign's game (auto-created by trigger), each independently flagged `visible_on_card` (visibility is orthogonal to the group). Master sheets have no fields of their own yet. JSON export/import only applies to `character` sheets. Visibility (RLS-enforced, not app-filtered): owner edits their own sheet in full (subject to the session lock above); a "master" (a user owning any `master`-type sheet in that campaign) reads every sheet in the campaign in full, read-only; everyone else reads only the `visible_on_card` fields of other members' sheets.
- **Dice tool**: decoupled/reusable component — free numeric face-count input + quick presets (d4/d6/d8/d10/d12/d20/d100), quantity (default 1). Public by default inside an active session; only the master can mark a roll private; rolls are logged against the session.

Deferred to later phases (not discarded): importable rules engine / auto-calculated rolls, delegated invite permissions, documents/maps with granular visibility, enforced/blocking turn order, multi-system campaigns, character portrait image upload (for personaje fichas).

## Phase-1 backlog

1. [done] Repo structure + Supabase local project + frontend skeleton
2. [done] Anonymous auth + optional email linking
3. [done] Campaña CRUD (create / invite-by-code / join)
4. [done] Fixed "default" game schema (stats/fields/state, no editor UI yet)
5. [done] Ficha CRUD (personaje + master) + JSON export/import
6. [done] Visibility rules (own ficha / public card / master view)
7. [done] Aventura CRUD
8. [done] Sesión (preparation → active → close) — manual close only; auto-close on everyone-disconnected (Realtime Presence) and master-editable turn order are not implemented, left for task 9 or later
9. [ ] Dice tool + session integration
10. [ ] Set up real/hosted Supabase environment (supabase.com project) and fill in `.env.local` — deferred until the rest of phase 1 is validated against local Supabase (Docker)

## Known environment notes

- Node is 20.17.0 locally; some deps want `^20.19.0 || ^22.13.0 || >=24` (EBADENGINE warning only, not currently fatal).
- Next.js 16 renamed `middleware.ts` to `proxy.ts` (deprecated, not removed) — relevant once auth/session interception is needed.
- No hosted Supabase project exists yet — creating one on supabase.com requires the user's own account, done manually; then fill in `.env.local` from `.env.local.example`.

## Working preferences

- Always confirm before making changes that go beyond what was explicitly asked.
- Never commit unless explicitly asked to.
