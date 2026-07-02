# Plan

> Last updated: 2026-02-22
> Status: Phase 1 in progress — core build complete, needs credentials + runtime testing

## Objective

Build Mycelium — a relationship management system for social purpose organisations. Unlike traditional CRMs, Mycelium treats relationships as living narratives, uses a network-first view, and allows mutual participation from the people in your network.

## Approach

- **Stack**: Next.js 15 (App Router), Neon Postgres, Drizzle ORM, NextAuth v5, Vercel AI SDK, D3.js, Stripe
- **Hosting**: Vercel (LHR edge), Neon (London eu-west-2)
- **Design**: Warm earth-tone palette (terracotta, moss, bark), DM Sans + system serif, organic animations
- **Architecture**: Multi-tenant (organisation as tenant), 4-layer progressive disclosure, provider-agnostic AI
- **Testing**: Vitest (unit/integration), Playwright (E2E), ~620 tests total target

## Tasks

### Phase 1: Foundation (Weeks 1-6)

- [x] Project scaffolding — Next.js 15, TypeScript, Tailwind, ESLint, Prettier
- [x] Database setup — Neon Postgres, Drizzle config, enum types
- [x] Core schema — organisations, users, connections, moments, qualities tables
- [x] Auth — NextAuth v5 with Google + email providers, JWT session
- [x] Organisation management — create, settings, slug-based routing
- [x] User management — registration, org memberships, role assignment
- [x] Stripe integration — plans (Individual/Organisation/Large), trial, webhooks
- [x] Connection CRUD — create/read/update/delete with org scoping
- [x] Moment CRUD — natural language input, attachment support, source types
- [x] Moment-connection linking — associate moments with connections
- [x] Simple connection list view — sortable, filterable
- [x] Mobile-responsive layout — warm cream palette, DM Sans typography
- [x] CI/CD — GitHub Actions for lint, test, build, deploy
- [ ] Runtime testing — verify full flow with real credentials (Google OAuth, Neon DB, Stripe)
- [ ] Initial git commit

**Deliverable:** Sign up, create org, add connections via natural language, view list. Payments work.

### Phase 2: Network (Weeks 7-12)

- [ ] Network data model — network_links table, strength calculation
- [ ] Network link inference — detect connections from co-mentioned moments
- [ ] Cluster detection — algorithm for identifying densely connected groups
- [ ] D3.js network view — force-directed graph, nodes sized by strength
- [ ] Network interactions — click, hover, drag, zoom levels, filtering
- [ ] WebGL rendering — for networks >500 nodes
- [ ] Connection story view — thread display, quality indicators, moment stream
- [ ] Quality spectrum UI — visual spectrum positions, quality arc over time
- [ ] AI moment understanding — parse NL input, extract entities, infer qualities
- [ ] AI provider registry — Vercel AI SDK, task-to-provider config, failover
- [ ] Search — full-text + semantic search with pgvector, moment_embeddings table

**Deliverable:** Network view as primary interface. Connections have stories and visible qualities.

### Phase 3: Intelligence (Weeks 13-18)

- [ ] AI thread synthesis — generate narrative summaries from moments
- [ ] Pattern recognition engine — dormant connections, dependencies, gaps, themes
- [ ] Observation generation — gentle insights delivered to users
- [ ] Observation UI — display, respond, dismiss, learn from engagement
- [ ] Quality inference from moments — auto-suggest spectrum position changes
- [ ] Dashboard view — ecosystem pulse, attention list, quality shifts, gap alerts
- [ ] River view — chronological moment stream across org
- [ ] Constellation view — cluster-based alternative network visualisation
- [ ] Spaces — create, assign connections, filter views by space
- [ ] Full permission matrix — owner/admin/contributor/viewer with bitmask overrides

**Deliverable:** Active AI observations and insights. Multiple views. Full permissions.

### Phase 4: Migration & Mutual (Weeks 19-24)

- [ ] Migration upload — CSV, Excel, Salesforce, Airtable, Google Contacts, Mailchimp
- [ ] AI migration conversation — conversational data understanding, not field mapping
- [ ] Migration network generation — create connections/qualities/links from conversation
- [ ] Migration UI — upload, conversation, review, refinement flow
- [ ] Mutual profiles — Layer 4 schema, token-based access
- [ ] Mutual invitation flow — generate link, send via Resend
- [ ] Mutual self-service UI — update context, set boundaries, signal needs
- [ ] Privacy controls — granular consent, data visibility settings
- [ ] Safeguarding module — isolated schema, encrypted storage, audit logging, retention

**Deliverable:** Conversational migration. People can hold their own end of the thread.

### Phase 5: Integration & Hardening (Weeks 25-30)

- [ ] Drift webhook integration — form submissions become moments
- [ ] Undercurrent integration — cross-product pattern recognition
- [ ] Glade integration — governance decisions linked to connections
- [ ] Super admin dashboard — org management, impersonation, feature flags, billing oversight
- [ ] Security hardening — rate limiting, CSRF, CSP, input validation, audit trail
- [ ] Performance optimisation — large network rendering, caching (Vercel KV)
- [ ] Accessibility audit — WCAG 2.1 AA, axe-core in E2E tests
- [ ] Mobile polish — quick capture, voice input, touch-optimised network
- [ ] Real-time updates — Ably/Pusher for network view collaboration
- [ ] Beta programme — deploy to selected organisations, collect feedback

**Deliverable:** Production-ready with integrations, security audit, accessibility certified.

### Phase 6: Launch (Weeks 31-34)

- [ ] Landing page — interactive demos of network view
- [ ] Public documentation
- [ ] Onboarding refinement from beta feedback
- [ ] Performance benchmarking — <2s network load for 500 connections
- [ ] Public launch

## Decisions Made

| Decision | Rationale | Date |
|----------|-----------|------|
| Next.js 15 + Neon + Drizzle | Consistent with Drift, Undercurrent, Glade stack | 2026-02-22 |
| Garden metaphor over pipeline | Relationships ebb/flow, don't progress linearly | 2026-02-22 |
| 4-layer progressive disclosure | Each layer optional, simple thing is the whole thing | 2026-02-22 |
| Qualities over tags | Fluid spectrums capture relationship texture better than static labels | 2026-02-22 |
| Provider-agnostic AI | Vercel AI SDK registry, no vendor lock-in | 2026-02-22 |
| Multi-tenant with org scoping | Row-level org_id on every query | 2026-02-22 |
| JWT without memberships in token | Prevents stale data, keeps token small — memberships loaded per-request | 2026-02-22 |
| Lazy Proxy pattern for DB/Stripe/Auth adapter | Build must succeed without env vars; runtime-only initialization | 2026-02-22 |
| Zod v3 compat layer (`zod/v3`) | Zod 4 breaking changes (enum args, no z.email), v3 API is stable | 2026-02-22 |
| Centralized relations.ts | Avoids circular imports between schema files | 2026-02-22 |
| `force-dynamic` on all DB-querying pages | Prevents prerender crashes without DATABASE_URL | 2026-02-22 |

## Open Questions

- [ ] **Naming**: Is "Mycelium" the right name? Shorter alternatives: Mycelia, Spore, Root, Hyphae
- [ ] **Network at scale**: Is Constellation view sufficient for >1,000 connections, or need something else?
- [ ] **Voice quality**: Is speech-to-text good enough for moments, or need a review/edit step?
- [ ] **Mutual layer adoption**: What's the minimum value prop for the person on the other end?
- [ ] **Offline support**: PWA with sync for fieldwork? Adds complexity
- [ ] **Additional CRM imports**: HubSpot? Action Network? CiviCRM?
- [ ] **Funder reporting**: How to provide engagement metrics without reinforcing extraction model?
- [ ] **API access**: Available from launch or gated to Large plan?
- [ ] **Self-hosted**: Demand for on-premises from orgs with strict data policies?
- [ ] **Network accessibility**: What's the screen reader equivalent of the relational network view?
- [ ] **Real-time provider**: Ably vs Pusher — needs evaluation
- [ ] **Media storage**: AWS S3 vs Cloudflare R2 — needs evaluation

## Out of Scope

- White-labelling (enterprise only, future)
- SSO / SAML (enterprise only, future)
- Custom data residency beyond UK/EU
- Native mobile apps (PWA first)
- Direct database integrations between products (webhook-driven only)

<!--
Update this file as work progresses. Tell Claude:
"Update PLAN.md to reflect what we just did, then continue with the next task."
-->
