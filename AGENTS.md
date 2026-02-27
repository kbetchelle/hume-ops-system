# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

HUME Ops System — a React/TypeScript PWA for hospitality/wellness club operations management. Frontend-only local dev; all backend services are hosted on Supabase (PostgreSQL, Auth, Realtime, Edge Functions, Storage).

### Running the app

- **Dev server:** `npm run dev` — starts Vite on port 8080
- **Build:** `npm run build`
- **Lint:** `npm run lint` (ESLint; the codebase has pre-existing lint errors — 329 errors, 23 warnings — mostly `@typescript-eslint/no-explicit-any` in Supabase Edge Function files)
- **Tests:** `npm run test` (Vitest; 5 test files, 9 passing tests)

### Key caveats

- The `.env` file is already committed with Supabase public (anon) keys — no secrets setup is needed for frontend dev.
- Supabase Edge Functions (in `supabase/functions/`) are Deno-based and deployed to Supabase cloud via `supabase functions deploy`. They do NOT run locally.
- Authentication requires a valid Supabase account. Without test credentials, the login page will show "Invalid login credentials." A test login account is needed for end-to-end testing beyond the login page.
- There are no Docker, devcontainer, or local database dependencies — everything runs against the hosted Supabase project.
- The `bun.lockb` file exists alongside `package-lock.json` — always use `npm` as the package manager (matching the lockfile).
