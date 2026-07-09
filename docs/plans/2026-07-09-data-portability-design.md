# Data portability & interoperability — design

> Status: Approved design (brainstorm) · 2026-07-09
> Scope: Tending (Mycelia) repo only. Two deliverables, sequenced: **Exports** first, then **Integration primitives** (generic webhooks + `/api/v1`).

## Context

Tending should always let users get their data out in useful ways, and let other apps connect to it. Two motivations:

1. **Data ownership / "work in the open".** Users can export all their data as JSON, YAML, and Markdown. The Markdown export follows the [Open Knowledge Format (OKF)](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) — a directory of cross-linked markdown files with YAML frontmatter — which maps naturally onto a connection's "living narrative" and is readable by both humans and AI agents.
2. **Interoperability.** Other apps — especially the sibling apps swells.app (Undercurrent) and ourglade.app (Glade), per the `watershed-spec.md` concept note — should be able to react to Tending events (webhooks) and read/write Tending data (an authenticated API).

The two halves share one **serialization layer**: the export's `collectOrgData`, the `/api/v1` read responses, and the webhook payloads all serialize the same entities. Build it once.

**Spine-agnostic, but forward-compatible.** The full "Watershed" event spine (a 4th app) is out of scope. We build Tending's own generic webhooks + API so any consumer works today (Zapier, a script, swells/glade directly), while adopting the Watershed envelope shape so plugging into the spine later is lift-and-shift, not redesign.

---

## Part 1 — Exports

### Decisions
- **Two tiers of format.** JSON + YAML are *full-fidelity structured dumps* (same object graph, two syntaxes) for backup/migration/re-import. Markdown is an *OKF knowledge bundle* for humans + AI.
- **Two entry points.** Whole-org "Export everything" (Settings, **admin+**) and per-connection export (connection page, **viewer+**).
- **Full faithful mirror.** Every org-owned record — connections (contact details, metadata), moments (author, source, event date, attachments), qualities, observations *including scheduled follow-up reminders*, spaces, network links, memberships — plus AI-derived narratives (thread summaries). Provenance preserved via existing `source`/`type` fields so inferred content is never mistaken for human-written. Exclude only operational secrets (Stripe/billing IDs, auth tokens, future integration secrets).
- **Synchronous** generation for v1; async (background job → blob → emailed link) is the documented scale path, not built now.

### Architecture — collect → render → package
`src/lib/export/`:
- **`collect.ts`** — `collectOrgData(orgId)` reads every org-owned entity via Drizzle into one typed in-memory object graph. Single source of truth reused by all renderers, the per-connection export (scoped subgraph), and `/api/v1`. A test asserts every schema table is represented so it can't silently drift.
- **`json.ts` / `yaml.ts`** — serialize the graph to a single `data.json` / `data.yaml` (every field, every ID, provenance intact).
- **`okf.ts`** — render the OKF bundle: a `path → contents` map of cross-linked markdown.
- **`archive.ts`** — zip the files into one download.

### OKF bundle layout
```
tending-export-<org>-2026-07-09.zip
├── README.md            # what this is, generated-at, how to read it
├── data.json            # full-fidelity structured mirror
├── data.yaml            # same, YAML
└── okf/
    ├── index.md         # org overview + counts (progressive disclosure)
    ├── connections/<name>.md   # frontmatter: type, id, contact, tags, timestamps
    │                           # body: thread summary, qualities, linked moments/spaces
    ├── moments/<id>.md         # each moment a node, cross-linked from its connections
    ├── spaces/<name>.md        # members + moments, as links
    ├── observations/index.md   # field notes + scheduled reminders
    └── members.md              # org team
```
Moments↔connections are many-to-many, so — true to OKF's graph model — each moment is its own doc cross-linked from every connection/space it touches, not duplicated inline. Frontmatter carries `source: inferred|manual`.

### Delivery & permissions
- Whole-org: **"Export everything"** button in Settings (**admin+**) → client `fetch` with the org header → streams the `.zip` as a blob download (a plain `<a download>` can't set the `x-organisation-id` header, so the client-fetch-blob pattern is used).
- Per-connection: **"Export"** action on the connection page (**viewer+**) → that connection's scoped bundle.

### Error handling
Collect is all-or-nothing — a failed read aborts rather than shipping a silent partial "mirror" (data integrity over half-exports). Empty orgs still produce a valid bundle.

### Testing
OKF renderer (sample graph → expected frontmatter + resolvable cross-links); JSON/YAML round-trip (serialize → parse → equals); "every table represented" guard; permission tests for both entry points.

### Dependencies (approved)
- **`yaml`** — YAML serialization.
- **`fflate`** — tiny, fast zip (serverless + browser safe).

---

## Part 2 — Integration primitives

### Decisions
- **Both directions**, webhooks built first.
- **Envelope:** adopt the Watershed spec §4.1 shape now, branded as Tending's own (`X-Tending-Signature` / `-Event` / `-Delivery` headers) — forward-compatible with the spine, zero rework later.
- **Events (5):** `moment.created`, `observation.generated`, `quality.shifted` (thresholded), `connection.created`, `follow_up.due`. Content minimised by default (key fields + truncated content + a `subject` ref/URL back).
- **API:** versioned `/api/v1`, API-key auth, `read` vs `read-write` scopes. Read (connections/moments/observations/spaces) + create-moment (write) + the deferred programmatic export. Simple in-DB rate limiting.

### Outbound — webhooks
**Schema:** `webhook_endpoints` (url, secret, subscribed events, status, last-delivery), `webhook_deliveries` (event id, endpoint, status, attempts, next-retry — the reliability layer the spec notes Glade lacks).

**`src/lib/webhooks/`:**
- `envelope.ts` — builds the Watershed-aligned envelope (`id`, `schemaVersion`, `event`, `occurredAt`, `sourceApp: "tending"`, `tenant`, `actor`, `subject`, `data`) + Zod schemas.
- `sign.ts` — HMAC-SHA256 sign/verify (Node `crypto`).
- `emit.ts` — `emitEvent(orgId, event, {actor, subject, data})`: build envelope → find subscribed endpoints → enqueue deliveries → attempt via `after()`.
- `deliver.ts` — POST with signature headers, 10s timeout, **SSRF guard** on the URL (reject private ranges).

**Emission points** (one `emitEvent` call each): moments POST → `moment.created`; connection create → `connection.created`; observation generate → `observation.generated`; quality inference (thresholded) → `quality.shifted`; the follow-up cron's scheduled→new flip → `follow_up.due`.

**Retry cron** `/api/cron/webhook-deliveries` (CRON_SECRET-guarded, added to `vercel.json`): sweeps failed deliveries on 1m/10m/1h/6h/24h backoff, marks `dead` after the last attempt; dead-letters visible in the UI. Idempotency: we mint the event `id`; consumers upsert on it.

### Inbound — `/api/v1`
- **`src/lib/api-keys/`** — generate (`tnd_live_…`), store sha256 hash only (shown once), `getApiContext(request)` reads `Authorization: Bearer`, resolves org + scope, tracks last-used.
- **Routes** `src/app/api/v1/`: `GET` connections / moments / observations / spaces (read); `POST /moments` (read-write) — the generalized "external app creates a moment" inbound; `GET /export?format=json|yaml|okf` (reuses `collectOrgData`).
- **Rate limiting:** simple in-DB fixed-window counter per key (no new infra).

### Settings UI
A new **"Developers"** panel (admin+): manage webhook endpoints (URL, event checkboxes, delivery status, rotate secret) and API keys (create → reveal once → revoke, last-used).

### Security / errors / testing
Secrets ≥32 bytes; SSRF guard on endpoint URLs; keys hashed at rest; scopes enforced per route; content minimised by default. Failures → backoff → dead-letter. Tests: HMAC round-trip, envelope schema, `emitEvent` targets only subscribed endpoints, backoff/dead-letter logic, API-key auth (valid/revoked/scope), SSRF rejection.

### Dependencies
**None** — Node `crypto`, existing cron pattern, Zod, Drizzle.

---

## Build order

1. **Exports** — `collectOrgData` + JSON/YAML + OKF renderer + zip + whole-org & per-connection entry points + Settings/connection UI. (Establishes the serialization layer.)
2. **Webhooks** — schema → envelope/sign → `emitEvent` + one emission point → delivery + SSRF → retry cron → Developers UI → remaining emission points.
3. **`/api/v1`** — API keys → read endpoints → programmatic export → create-moment → rate limiting → keys UI.

## Out of scope (deferred)
- The Watershed spine itself (4th app), the shared `@goodship/watershed` package, pairing/entitlements, inbound *signed* event handling — all land when the spine is built; the envelope + emitters here are the forward-compatible foundation.
- Async/background export generation (scale path).
- Redis/Upstash rate limiting (only if in-DB proves insufficient).
