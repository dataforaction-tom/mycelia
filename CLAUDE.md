# Project: Tending

A relationship management system for social purpose organisations, at tending.network. The mycelium metaphor runs all the way through — relationships are living narratives, not records. (The repo folder and internal names still say "mycelia"/"mycelium"; only the display name changed.)

## Architecture

- `src/app/` — Next.js 15 App Router pages and API routes
- `src/components/` — React components (ui/, layout/, connections/, moments/, organisations/, auth/, billing/)
- `src/lib/` — Business logic (db/, auth/, stripe/, validators/, utils/, config/)
- `src/lib/db/schema/` — Drizzle ORM schema (tables in individual files, relations in relations.ts)
- `src/types/` — TypeScript type augmentations

## Commands

- `npm run dev` — start development server
- `npm test` — run Vitest tests
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run format` — Prettier format
- `npm run db:generate` — generate Drizzle migrations
- `npm run db:push` — push schema to database
- `npm run db:studio` — open Drizzle Studio

## Standards

- Zod v3 API for validators (`import { z } from "zod/v3"`)
- Lazy DB/Stripe initialisation — never instantiate clients at module level
- Org scoping via `x-organisation-id` header on API routes
- JWT auth strategy (no sessions table) — token carries `id` + `platformRole`
- Server pages that query DB need `export const dynamic = "force-dynamic"`
- Warm earth tone theme: terracotta, moss, bark, cream, amber, sky
- DM Sans font via next/font/google

## Verification

- Run `npx tsc --noEmit` after changes
- Run `npm run build` after structural changes
- Run `npm test` after changing tested code
- Run `npm run lint` before considering any task complete

## Working Rules

- Always check for existing patterns before creating new ones
- Prefer small, incremental changes over big rewrites
- If a task will take more than ~50 lines of changes, use plan mode first
- Don't add dependencies without asking
- Don't refactor code that wasn't part of the task

## State & Progress

> Updated: 2026-02-22
> Current focus: Phase 1 Foundation complete
> Status: All 13 tasks implemented. Build passes, 12 tests green.

See PLAN.md for task tracking, STATE.md for system state.

## Known Issues

- Next.js 16.1.6 shows "middleware is deprecated" warning — middleware still works but may need migration to "proxy" convention
- Zod 4 installed but using v3 compat layer (`zod/v3`) because v4 API has breaking `.enum()` signature
- Node engine warnings (v20.18.1 vs >=20.19.0) — cosmetic only

## Lessons Learned

- DrizzleAdapter does runtime type check (`is(db, PgDatabase)`) — Proxy wrappers fail. Use lazy adapter via Proxy that defers to real adapter methods.
- Neon `neon()` throws at module eval if DATABASE_URL missing. Use lazy init pattern for build-time safety.
- Stripe client also crashes without key at module level. Use `getStripe()` function.
- `export const dynamic = "force-dynamic"` needed on all server pages that access DB.
- Schema files should NOT import each other for relations — put all relations in a single `relations.ts` to avoid circular deps.
