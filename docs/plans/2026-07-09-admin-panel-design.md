# Admin Panel — Design & Plan

> Status: Proposed — 2026-07-09
> Author: Tom + Claude
> Scope: Platform-level admin/operations console for Tending, gated to `super_admin`.

## 1. Goal

A single-operator (`super_admin`) console at `/admin` to run the business day-to-day:

- **Observe** — user numbers, sign-ups over time, org/plan distribution, usage.
- **Manage licenses** — see each org's plan, trial/expired state, seat usage vs limits (local data only, no live Stripe).
- **Support users** — resend magic link, change a user's email, force sign-out, suspend/delete accounts.
- **Triage feedback** — users submit bug reports / feature requests in-app; admin triages them.

Everything reuses the existing Tending design system (forest-floor light shell, terracotta/moss/bark tokens, Gloock display headings, existing `ui/` primitives). It reads as *the same product, one layer up* — not a bolted-on dashboard.

## 2. Decisions locked (from planning Q&A)

| Decision | Choice |
|---|---|
| Account actions | Resend magic link · Change email · Force sign-out/revoke · Delete/deactivate |
| Feedback model | Users submit in-app + admin triage |
| Billing depth | Local plan tiers only (no live Stripe API) |
| Admin access | Single `super_admin` (+ tiny optional audit log) |

## 3. Key constraints discovered in the codebase

These shape the design — read before building.

1. **`super_admin` exists but is never enforced.** `platformRole: "super_admin" | "user"` is on `users` and already flows into the JWT/session (`src/lib/auth/index.ts`), refreshed from the DB on every request. **This panel is the first-ever platform-level authorization.** No `/admin` routes, no `requireSuperAdmin()` helper exist yet.
2. **No passwords.** Auth is magic-link only (Resend) + a dev-only credentials bypass. "Reset password" ⇒ *resend magic link*.
3. **No email-change flow.** `users.email` is `notNull().unique()` and is the identity anchor for magic links. Changing it is net-new and must be treated carefully.
4. **JWT strategy, no sessions table.** Tokens can't be revoked today. Force-sign-out needs a `tokenVersion` counter (§5.2) — cheap because the jwt callback *already* does a per-request DB read we can extend.
5. **Billing is thin locally.** Only `stripeCustomerId`, `stripeSubscriptionId`, derived `plan` tier, `trialEndsAt` live in the DB. MRR/invoices/renewal dates are Stripe-only — deliberately out of scope.
6. **No cross-org aggregate queries exist.** All counts are org-scoped today; the admin dashboard is the first consumer of platform-wide aggregates.
7. **No Table / Pagination primitive.** Lists are card grids or stacked bordered rows. Admin lists can get long, so a `Table` + `Pagination` is the one net-new UI primitive worth adding to `src/components/ui/`.

## 4. Access model & routing

### 4.1 The guard
Add to `src/lib/auth/permissions.ts` (mirrors the existing `requireMembership`):

```ts
export function isSuperAdmin(session): boolean
export async function requireSuperAdmin(): Promise<Session>  // throws "Forbidden" if not super_admin
```

- **Server pages:** new route group `src/app/(admin)/` with a `layout.tsx`:
  ```ts
  const session = await auth();
  if (session?.user?.platformRole !== "super_admin") notFound(); // 404, don't reveal the panel exists
  ```
- **API routes:** middleware skips `/api/*`, so every `/api/admin/*` handler calls `requireSuperAdmin()` itself. Do **not** rely on middleware.
- **Bootstrap:** there's no UI to grant the first `super_admin`. One-off: set your own row via a small script (`scripts/grant-super-admin.ts`) or Drizzle Studio. Documented in STATE.md. Because the jwt callback refreshes role every request, it takes effect without re-login.

### 4.2 Route structure (new `(admin)` group)
```
src/app/(admin)/
  layout.tsx                 # super_admin guard + AdminShell
  admin/
    page.tsx                 # Overview: metrics + sign-up chart
    users/
      page.tsx               # Users list (search, filter, paginate)
      [userId]/page.tsx      # User detail + account actions
    organisations/
      page.tsx               # Orgs list: plan, state, seats, usage
      [orgId]/page.tsx       # Org detail: members, usage, billing state
    feedback/
      page.tsx               # Feedback triage queue
      [feedbackId]/page.tsx  # Feedback detail
    usage/page.tsx           # Cross-org usage vs plan limits
```
All admin pages need `export const dynamic = "force-dynamic"` (they hit the DB).

## 5. Data model changes

### 5.1 `feedback` table (new) — `src/lib/db/schema/feedback.ts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `defaultRandom()` |
| `organisationId` | uuid FK→organisations, `set null` | context, nullable |
| `userId` | uuid FK→users, `set null` | who submitted, nullable |
| `type` | enum `feedback_type` | `bug` \| `feature` \| `other` |
| `title` | text notNull | |
| `body` | text notNull | |
| `status` | enum `feedback_status` | `new` \| `triaged` \| `planned` \| `in_progress` \| `done` \| `declined` (default `new`) |
| `priority` | enum `feedback_priority` | `low` \| `medium` \| `high` (default `medium`) |
| `adminNotes` | text | internal, nullable |
| `pageUrl` | text | where it was submitted from, nullable |
| `createdAt` / `updatedAt` | timestamptz | |

### 5.2 `users` additions — `src/lib/db/schema/auth.ts`
| Column | Type | Purpose |
|---|---|---|
| `tokenVersion` | integer notNull default 0 | Force sign-out. Bumping it invalidates existing JWTs. |
| `status` | enum `user_status` `active` \| `suspended` (default `active`) | Soft deactivate; blocks sign-in. |
| `suspendedAt` | timestamptz nullable | audit/UX |

**Force-sign-out mechanism:** put `tokenVersion` into the JWT on sign-in. The jwt callback already re-reads the user from the DB each request (the `!user && token.id` branch) — extend that same select to fetch `tokenVersion` + `status`; if `tokenVersion` mismatches or `status === "suspended"`, invalidate the session. Also block suspended users in the `signIn` callback. **No new per-request DB cost** — we're widening an existing query.

### 5.3 `adminActions` audit log (new, small, optional-but-recommended) — `src/lib/db/schema/admin.ts`
| Column | Type |
|---|---|
| `id` uuid PK · `actorUserId` uuid FK · `action` text (e.g. `user.suspend`) · `targetType` text · `targetId` uuid · `metadata` jsonb · `createdAt` timestamptz |

Written on every destructive/account action. Cheap insurance since destructive actions run solo; the audit page is read-only.

### 5.4 Migration
`npm run db:generate` → review → `npm run db:push`. **Reminder (from memory):** `.env.local` `DATABASE_URL` points at the live prod Neon DB, and `drizzle.config` doesn't load `.env.local` — pass `DATABASE_URL` explicitly. Test the migration on a branch DB first if possible.

## 6. Feature areas

### 6.1 Overview dashboard (`/admin`)
Stat cards (reuse the Pulse `bg-white/75 … shadow` card): **total users**, **new sign-ups (7d / 30d)**, **active orgs**, **paying orgs**, **trials ending soon**, **total connections**, **total moments (this month)**, **open feedback**. Plus a **sign-ups-over-time** line/bar (group `users.createdAt` by day/week) and a **plan-distribution** breakdown (trial / individual / expired via `subscriptionState`). All new cross-org aggregate queries in `src/lib/admin/metrics.ts`.

### 6.2 Users (`/admin/users`)
- List: avatar/initials, name, email, `platformRole` badge, `status` badge, org count, created date. Search (name/email), filter by status/role, paginate. Uses the new `Table` primitive.
- Detail (`/admin/users/[userId]`): profile, orgs+roles, recent activity counts, and the **account actions** panel (§6.5).

### 6.3 Organisations / licenses (`/admin/organisations`)
- List: name, slug, plan badge, `subscriptionState()` (trialing/active/expired), `trialEndsAt`, member count, `stripeCustomerId` present?. Filter by plan/state.
- Detail: members (reuse role-pill styling from `MembersManager`), usage vs `PLAN_LIMITS[plan]` (connections/moments/spaces/members with progress bars), local billing state + a link out to the Stripe dashboard customer (deep link, not an API call).

### 6.4 Usage (`/admin/usage`)
Cross-org table: each org's counts vs its plan limits, highlight orgs near/over limit. Reuses the existing count patterns (`src/lib/moments/quota.ts` etc.), lifted into `src/lib/admin/usage.ts` as batched cross-org aggregates (avoid N+1 — one grouped query per metric).

### 6.5 Account actions (on user detail)
Each is a `POST /api/admin/users/[userId]/<action>`, guarded by `requireSuperAdmin()`, confirmed via `Dialog`, toasts on result, writes an `adminActions` row.

| Action | Behaviour |
|---|---|
| **Resend magic link** | Calls the existing Resend magic-link sender to the user's email. The real "reset password". |
| **Change email** | Update `users.email` (unique — handle collisions with a clear error), send a notification to old + new address, send a fresh magic link to the new address. New `sendEmailChangedEmail` in `src/lib/email/messages.ts`. |
| **Force sign-out** | `tokenVersion++`. Session invalidated on next request (§5.2). |
| **Suspend / reactivate** | Toggle `status`; suspend also bumps `tokenVersion` for immediate effect. |
| **Delete** | Hard delete (cascades memberships/moments authored → note `moments.authorId` behaviour before deleting). Strong double-confirm (type the email). Prefer suspend for spam; delete for GDPR/erasure requests. |

### 6.6 Feedback (`/admin/feedback`)
- **User-facing submit widget:** a small "Send feedback" button in `DashboardShell` (dialog: type + title + body; auto-captures `pageUrl`, `userId`, `organisationId`). `POST /api/feedback` (auth required, any member). Reuses `Dialog` + `Toast`.
- **Admin triage:** queue grouped by status, filter by type/priority/status. Detail view edits `status`, `priority`, `adminNotes`. Optional later: email the submitter on status change (reuse email infra).

## 7. UI / design mapping

Reuse, don't reinvent:
- **Shell:** `AdminShell` = a trimmed copy of `DashboardShell` (drop `MomentComposerProvider`), with an admin `Sidebar` reusing the `NavDotLink` pattern. Admin nav: Overview · Users · Organisations · Usage · Feedback · Audit.
- **Headers:** `stagger-children` + `font-display text-4xl text-bark` + muted subtitle (the standard page-header pattern).
- **Stat cards / tables / row lists:** Pulse stat cards; new `Table` + `Pagination`; stacked-bordered-row pattern (`MembersManager`) for dense lists.
- **Primitives:** `Button`, `Card`, `Badge` (role/status/plan colour maps), `Dialog` (destructive confirms), `Select`, `Input`, `Toast`, `Skeleton`, `Avatar` — all exist.
- **Filters:** the auto-submitting `method="GET"` form pattern from `moment-filters.tsx` (drives server `searchParams`, works with pagination).
- **Net-new primitive:** `src/components/ui/table.tsx` + `pagination.tsx` (accessible, terracotta focus rings, `divide-border` rows) — the only genuinely missing pieces.

## 8. API surface (all under `requireSuperAdmin()`, standard `{success,data|error}` envelope)

```
GET  /api/admin/metrics                       # overview aggregates
GET  /api/admin/users            ?q&status&role&page
GET  /api/admin/users/[userId]
POST /api/admin/users/[userId]/resend-magic-link
POST /api/admin/users/[userId]/change-email    { email }
POST /api/admin/users/[userId]/force-signout
POST /api/admin/users/[userId]/suspend | /reactivate
DEL  /api/admin/users/[userId]                 { confirmEmail }
GET  /api/admin/organisations    ?q&plan&state&page
GET  /api/admin/organisations/[orgId]
GET  /api/admin/usage
GET  /api/admin/feedback         ?status&type&priority&page
PATCH/api/admin/feedback/[id]                  { status?, priority?, adminNotes? }
# user-facing:
POST /api/feedback               (any authenticated member)  { type, title, body, pageUrl }
```

## 9. Build plan (phased, each independently shippable)

**Phase 0 — Foundations**
- `requireSuperAdmin()` + `isSuperAdmin()` helpers; `(admin)` route group + guarded layout + `AdminShell` + admin `Sidebar`.
- `scripts/grant-super-admin.ts`; grant your own role; document in STATE.md.
- `Table` + `Pagination` primitives.

**Phase 1 — Observability (read-only, safe)**
- `src/lib/admin/metrics.ts` + `usage.ts` (cross-org aggregates, batched).
- `/admin` overview, `/admin/users` list, `/admin/organisations` list + detail, `/admin/usage`.

**Phase 2 — Account actions (schema + writes)**
- Schema: `users.tokenVersion` / `status` / `suspendedAt`; extend jwt + signIn callbacks; `adminActions` table.
- User detail page + the five actions + `sendEmailChangedEmail`.

**Phase 3 — Feedback**
- `feedback` schema + enums; user submit widget + `POST /api/feedback`; admin triage queue + detail.

**Phase 4 — Audit view (optional)**
- Read-only `/admin/audit` over `adminActions`.

## 10. Risks & watch-outs

- **First platform authz** — get the guard right (layout `notFound()` + every API route calls `requireSuperAdmin()`; middleware won't help). Add a test that a `user`-role account 404s on `/admin` and 403s on `/api/admin/*`.
- **Email change** — `email` is unique and the magic-link identity anchor. Handle collisions, and don't orphan pending `organisationInvitations` (keyed by email). Notify both addresses.
- **Hard delete** — check `moments.authorId` / other `authorId` FK on-delete behaviour before enabling delete; prefer suspend by default.
- **Prod DB** — local env points at live prod Neon (see memory note). Run the migration carefully; pass `DATABASE_URL` explicitly to Drizzle.
- **Aggregate cost** — cross-org counts on growing tables; use grouped queries (no N+1) and add `unstable_cache` with a short TTL if the overview feels slow.

## 11. Verification (per phase)
`npx tsc --noEmit` → `npm run lint` → `npm test` → `npm run build`. Add tests: super_admin guard (403/404 for non-admins), token-version invalidation, email-change collision, feedback submission. Manually drive each account action against a test user before shipping Phase 2.
