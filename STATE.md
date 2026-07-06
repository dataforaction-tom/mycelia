# State

> Last updated: 2026-07-02

## System State Diagram

```mermaid
stateDiagram-v2
    [*] --> Planning: project started
    Planning --> Setup: plan approved
    Setup --> Building: environment ready
    Building --> Testing: features complete
    Testing --> Deploying: tests pass
    Deploying --> Live: deployed

    note right of Building: ← WE ARE HERE
```

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| Project scaffolding | ✅ Done | Next.js 15, Tailwind v4, DM Sans, earth-tone theme |
| Database schema | ✅ Done | 7 schema files, centralized relations.ts, all enums |
| Auth (NextAuth v5) | ✅ Done | Google + Resend providers, JWT, lazy adapter Proxy |
| Middleware | ✅ Done | Protects org routes, allows /sign-in, /new-org, /api |
| API routes | ✅ Done | 12 route files — orgs, members, connections, moments, stripe |
| Dashboard pages | ✅ Done | 9 pages — dashboard, connections (list/new/detail), moments (list/new), settings, billing, members. `moments` index page added 2026-07-06 — sidebar had linked to it since Phase 1 but the page never existed (404), found via manual testing |
| Auth pages | ✅ Done | Sign-in (Google + magic link), new-org creation |
| UI components | ✅ Done | 12 primitives (button, input, card, badge, dialog, etc.) |
| Layout (sidebar/header/mobile) | ✅ Done | Responsive sidebar, mobile drawer, dynamic org-slug nav |
| Feature components | ✅ Done | Connection list/card/form/picker, moment form/card/list, org forms, billing |
| Stripe integration | ✅ Done | Lazy client, checkout, portal, webhook handler |
| Validators (Zod) | ✅ Done | Org, connection, moment, auth schemas (using zod/v3) |
| CI/CD | ✅ Done | GitHub Actions: lint, typecheck, test, build |
| Unit tests | ✅ Done | 12 tests (slugify + permissions) |
| Homepage flow | ✅ Done | CTA for unauth, auto-redirect for auth users |
| Network data model | ✅ Done | `network_links` table, canonical pair strength calc, co-mention inference hook, `GET /api/network` |
| Cluster detection | ✅ Done | Deterministic label propagation (`src/lib/network/clusters.ts`), wired into `GET /api/network` as `clusterId` per node |
| D3 network view | ✅ Done | `/{orgSlug}/network` page, static force-directed SVG render, nodes sized/colored, edges styled by strength |
| Network interactions | ✅ Done | Pan/zoom, node drag, hover tooltip, click-to-navigate to connection detail, type/strength/unconnected filters, search-and-center (`network-graph.tsx`, `network-controls.tsx`) |
| Connection story view | ✅ Done | Story section always visible (with empty state), moment stream now reuses `MomentList`/`MomentCard` |
| Quality spectrum UI | ✅ Done | 5 hardcoded spectrums (depth/reciprocity/formality/activity/maturity), manual position-setting via `POST /api/connections/[connectionId]/qualities`, sparkline history, wired into connection detail page |
| AI provider registry | ✅ Done | OpenRouter primary + local Ollama fallback via `withFallback()` (`src/lib/ai/`). Task→model config |
| AI moment understanding | ✅ Done | `POST /api/moments/understand` (read-only, no DB writes), structured output via `generateObject` (`run-object-task.ts`, `moment-understanding.ts`). Moment form now has an "Understand with AI" panel — matches existing connections (checkbox to add), lists unmatched entities (informational only, no auto-create), detects event date (prefills new date field). Moment form also gained its first-ever event date input |
| Automatic quality inference | ✅ Done | Every moment save now auto-infers quality signals for its linked connections (`src/lib/ai/quality-inference.ts`, the `"quality-inference"` task/cheap model), writing `source: "inferred"` rows with real `momentId`/`confidence` — best-effort, wrapped in its own try/catch so a failed AI call never blocks moment creation. Replaced the old manual "Apply" quality flow in the moment-understanding panel (would have double-written). Quality display now shows an "AI-suggested" badge for inferred rows. Verified live 2026-07-06 with a real OpenRouter key — one sentence of moment text produced two real inferred quality rows |
| Search | ✅ Done | Full-text search on moment content (Postgres `to_tsvector`/`plainto_tsquery` + GIN expression index), connection name search via `ilike`. `/{orgSlug}/search` server component, no new API route. Semantic/pgvector search deferred |
| AI thread synthesis | ✅ Done | Automatic, same pattern as quality inference — after a moment save, for each linked connection with ≥2 total moments, `src/lib/ai/thread-synthesis.ts` regenerates `connections.threadSummary` (incremental: passes the previous summary + last 20 moments so tone/continuity carry forward), best-effort per-connection try/catch. Verified live 2026-07-06 with a real OpenRouter key — produced a genuinely coherent narrative referencing specific moments and a tone shift, not just concatenated moment text |
| Spaces | ✅ Done | Full CRUD (`/api/spaces`, `/api/spaces/[spaceId]`), connection assignment (`SpacePicker`, `/api/connections/[connectionId]/spaces`), settings management UI (`settings/spaces`), space filter on connections/moments list pages, moment form space `<select>`. Fixed a real bug: `GET /api/moments` ignored `spaceId` when `connectionId` was also present. `moments.spaceId` FK now `onDelete: set null`. Network-view overlay (spaces as nodes) deferred to a follow-up task |
| Pattern recognition engine | ✅ Done | New `observations` table (3 new enums). Three deterministic detectors: dormant (`src/lib/observations/generate.ts`, date-threshold query), quality shift (`src/lib/network/quality-shifts.ts`, ≥0.4 delta), dependency/bridge risk (`src/lib/network/dependencies.ts`, iterative DFS articulation-point algorithm — 9 unit tests covering path/star/bowtie/complete-graph fixtures). `POST /api/observations/generate` (manual trigger, no cron infra exists), `GET /api/observations` (list). Naive existence-check dedup guard (real dedup is a later task). Theme/gap detection deferred (see Follow-up Tasks). Verified live: created a real path-graph structure (3 connections), strengthened edges past the 0.7 threshold via repeated moments, confirmed a real dependency observation fired ("2 of your strongest relationships are all connected through Sarah Jenkins...") and idempotency (re-running created 0 more) |
| Observation UI | ✅ Done | `PATCH /api/observations/[observationId]` (dismiss/mark-as-acted-on with optional response text), `GET /api/observations` now flips `new`→`seen` as a read-receipt side effect. `/{orgSlug}/observations` page with status filter, severity-colored cards (gentle=sky/noteworthy=amber/important=terracotta, not destructive-red — these are suggestions not alerts), manual "Check for patterns" trigger button. No scoring/learning logic — explicit non-goal, no data to learn from yet. Verified live: dismissed/acted-on a real generated observation, confirmed persistence and filter behavior |
| DB migration | ✅ Done | `db:push` applied to Neon 2026-07-06 (three times — spaces FK change, observations table) (`drizzle-kit` needs `DATABASE_URL` passed explicitly — it doesn't read `.env.local` on its own) — all tables/indexes are live |
| Runtime testing | ✅ Done | End-to-end smoke pass via the dev-login credentials flow, driven with `curl` (no browser tool available): sign-in → org → connections → moment with linked connections → network inference → cluster detection → qualities → search, all verified against the real DB. Found and fixed 2 real bugs (see MISTAKES.md 2026-07-06). Google OAuth/Resend still not configured — only the dev-only credentials provider was exercised |
| Git init + first commit | ✅ Done | Initial commit `e21576a` |

## Architecture

```mermaid
flowchart LR
    Browser --> Middleware
    Middleware --> AuthPages["Auth Pages\n/sign-in, /new-org"]
    Middleware --> Dashboard["Dashboard\n/{orgSlug}/*"]
    Dashboard --> API["API Routes\n/api/*"]
    API --> Auth["NextAuth v5\nJWT + Google/Resend"]
    API --> DB["Neon Postgres\nDrizzle ORM"]
    API --> Stripe["Stripe\nCheckout/Webhooks"]
```

## Key Files

| Path | Purpose |
|------|---------|
| `src/lib/db/index.ts` | Lazy Proxy DB — only connects on first query |
| `src/lib/db/schema/` | 7 schema files + relations.ts + index.ts barrel |
| `src/lib/auth/index.ts` | NextAuth config with lazy adapter Proxy (4 traps) |
| `src/lib/auth/permissions.ts` | Role hierarchy, getMembership, requireMembership |
| `src/lib/utils/api.ts` | Response helpers, getAuthenticatedUser, getOrgContext |
| `src/lib/config/plans.ts` | Plan limits + Stripe price IDs |
| `src/lib/validators/` | Zod schemas for all entities |
| `src/middleware.ts` | Route protection |
| `src/components/layout/sidebar.tsx` | Dynamic nav with getNavItems(orgSlug) |

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Neon Postgres | Configured | `DATABASE_URL` is set in `.env.local`; dev server boots and `/api/network` responds (401 unauthenticated, as expected) — full authenticated flow still needs Google OAuth |
| Google OAuth | Not set up | Need AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET |
| AUTH_SECRET | Set in .env.example | Run `npx auth secret` to set in .env.local |
| Resend (email) | Not set up | Need AUTH_RESEND_KEY |
| Stripe | Not set up | Need STRIPE_SECRET_KEY + price IDs |
| OpenRouter | Configured | `OPENROUTER_API_KEY` set in `.env.local` 2026-07-06 — verified working live |
| Ollama (local) | Optional | `OLLAMA_BASE_URL` defaults to `http://localhost:11434/v1`, `OLLAMA_MODEL` defaults to `llama3.2` — used as fallback when OpenRouter fails or is unconfigured |

## Build Status

- `npm run build` — passes (26 routes, 0 errors)
- `npx tsc --noEmit` — passes
- `npm test` — 41 tests pass (slugify: 6, permissions: 6, network strength: 7, clusters: 6, AI fallback: 3, dependencies/articulation-points: 9, quality-shifts: 4)
- `npm run lint` — 1 pre-existing error unrelated to network work (`settings/members/page.tsx` setState-in-effect)
- Dev server smoke test: boots cleanly against the real Neon DB, `/api/network` correctly 401s unauthenticated, `/` returns 200

## Known Issues (additions)

- **jsdom test environment is broken in this dev environment**: Node is
  v20.18.1, but jsdom 27's `@csstools/css-calc` (via `@asamuzakjp/css-color`)
  requires Node ≥20.19 and ships an ESM-only build that fails a CJS
  `require()` at vitest worker startup (`ERR_REQUIRE_ESM`). This means no
  `@testing-library/react` component test can run here until Node is
  upgraded — not just the "cosmetic" engine warning previously noted.
  A planned smoke test for `network-graph.tsx` was dropped for this reason;
  see MISTAKES.md.

<!--
Keep this file as the single source of truth for "where are we?"
The /status command reads this file.
-->
