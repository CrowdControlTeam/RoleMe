# RoleMe

Web app for organizing live tabletop RPG sessions: campaigns, adventures, character sheets, shared dice rolls.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- next-intl for i18n (Spanish is currently the only shipped locale, in `src/messages`)
- Supabase (Postgres + Auth + Realtime + Storage)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase

Local project config lives in `supabase/`. To run a full local Supabase stack (requires Docker):

```bash
npx supabase start
```

To connect the app to a Supabase project (local or hosted), copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

Creating a hosted project on [supabase.com](https://supabase.com) is a manual step (needs your own account) and isn't part of this scaffold.
