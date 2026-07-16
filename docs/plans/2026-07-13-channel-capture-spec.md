# Channel Capture — Specification

> Status: Draft for review
> Date: 2026-07-13
> Scope: Email, WhatsApp, Telegram, Signal (position statement), PWA Share Target, Bluesky (AT Protocol), Mastodon / Fediverse (ActivityPub)

Tending should meet people where their relationships already live — email,
messaging apps, and the open social web — and let them pull moments from
those channels **when they choose to**. This spec defines a single shared
ingestion architecture plus seven channel adapters.

---

## 1. Principles

1. **Deliberate capture, never sync.** Tending never reads an inbox, a chat
   history, or a timeline. A moment only exists because a human forwarded,
   shared, mentioned, or messaged it to Tending. Consent is structural, not a
   checkbox. This is a stated product promise: *"Tending never reads your
   inbox."*
2. **Open protocols first.** Where a channel has an open, federated protocol
   (AT Protocol, ActivityPub, SMTP), we implement it properly — real OAuth,
   real federation, no scraping, no unofficial client libraries.
3. **One pipeline, many doors.** Every adapter normalises into the same
   inbound shape and terminates in the existing
   `applyMomentSideEffects` pipeline. Channel code is thin; intelligence
   (identity matching, AI understanding, thread synthesis) is shared.
4. **Human in the loop.** Machine-parsed moments land as *suggested* and are
   confirmed (or edited/discarded) by a person before they fully join the
   narrative. Confirmation should take one tap.
5. **Provenance is visible.** Every ingested moment records which channel it
   came from and (where shareable) a link back to the source.

---

## 2. Shared architecture

### 2.1 The normalised inbound shape

Every adapter produces an `InboundCapture` and hands it to a single
`ingestCapture()` function in `src/lib/ingest/`:

```ts
interface InboundCapture {
  channel: CaptureChannel;            // "email" | "whatsapp" | "telegram" | "share" | "bluesky" | "mastodon"
  organisationId: string;             // resolved by the adapter from its binding
  capturedByUserId: string | null;    // the Tending user who caused the capture, if known
  externalId: string;                 // channel-native unique id (Message-ID, wamid, at:// URI, status URI…)
  externalUrl?: string;               // canonical link back to the source, if public
  text: string;                       // cleaned body text
  attachments?: InboundAttachment[];  // images / audio to store or transcribe
  participants: ChannelIdentity[];    // sender + other parties, as channel-native identifiers
  occurredAt?: Date;                  // when the underlying interaction happened
  raw?: Record<string, unknown>;      // trimmed original payload, kept in aiExtraction for audit
}

interface ChannelIdentity {
  kind: "email" | "phone" | "telegram" | "at_did" | "ap_actor";
  value: string;                      // e.g. "amina@example.org", "+447…", "did:plc:abc…", "https://mas.to/users/amina"
  displayName?: string;
}
```

### 2.2 The pipeline

```
adapter (verify, parse, resolve org)
  → dedupe on (organisationId, channel, externalId)
  → checkMomentQuota(organisationId)            // existing — billing applies to every door
  → matchConnectionsByIdentity(participants)     // new deterministic matcher, §2.5
  → understandMoment(text, connections)          // existing AI extraction for unresolved names/dates
  → transcribe audio attachments                 // existing transcription path
  → insert moment { source: channel, status: "suggested", aiExtraction }
  → applyMomentSideEffects(...)                  // existing: linking, network, qualities, thread, webhooks
  → channel confirmation (reply/DM/notification) // §2.6
```

### 2.3 Schema changes

**Enum additions** (`src/lib/db/schema/enums.ts`):

```ts
// momentSourceEnum gains:
"whatsapp" | "telegram" | "share" | "bluesky" | "mastodon"
// (email already exists)

export const momentStatusEnum = pgEnum("moment_status", [
  "captured",   // default; manually composed moments are captured immediately
  "suggested",  // machine-ingested, awaiting one-tap confirmation
  "discarded",  // rejected suggestion — kept briefly for undo, then purged by cron
]);

export const captureChannelEnum = pgEnum("capture_channel", [
  "email", "whatsapp", "telegram", "share", "bluesky", "mastodon",
]);
```

**`moments` gains** `status: momentStatusEnum` (default `captured`) and
`externalRef: text` (nullable; `<channel>:<externalId>` for dedupe + linkback).
A partial unique index on `(organisation_id, external_ref) WHERE external_ref
IS NOT NULL` makes re-delivery idempotent.

**New table `capture_channels`** — per-org channel bindings, managed in
Settings → Channels:

```ts
capture_channels {
  id uuid pk
  organisationId uuid fk → organisations (cascade)
  channel captureChannelEnum
  // channel-specific binding, typed per channel:
  //  email:    { token: "moss-fern-a8c2" }               → moss-fern-a8c2@in.tending.network
  //  whatsapp: { }                                        (binding is user-level, §4)
  //  telegram: { }                                        (binding is user-level, §4)
  //  bluesky:  { did, handle, pdsUrl, tokens… }           org's authorised Bluesky account
  //  mastodon: { instanceUrl, accountId, tokens… }        org's authorised Mastodon account
  //  ap_actor: { preferredUsername, keys… }               org's native fediverse actor (§9.3)
  config jsonb
  active boolean default true
  createdById uuid fk → users
  createdAt / updatedAt timestamptz
}
```

Secrets inside `config` (OAuth tokens, signing keys) are encrypted at rest
with an app-level key (AES-GCM via `ENCRYPTION_KEY` env), never returned by
any API.

**New table `user_channel_links`** — binds a channel-native sender identity to
a Tending user, so an inbound WhatsApp/Telegram message knows who is
capturing and for which org:

```ts
user_channel_links {
  id uuid pk
  userId uuid fk → users (cascade)
  organisationId uuid fk → organisations (cascade)   // captures land in this org
  kind text                                          // "phone" | "telegram" | "at_did" | "ap_actor"
  value text                                         // E.164 phone, telegram user id, DID…
  verifiedAt timestamptz
  unique(kind, value)                                // one owner per identity
}
```

**`connections.contactDetails` gains optional fields** (JSONB — no
migration): `bluesky?: string` (handle or DID), `fediverse?: string`
(`@user@instance`), `telegram?: string`, `whatsapp?: string` (E.164). These
are the identity keys the matcher (§2.5) uses.

### 2.4 Routes and workers

```
src/app/api/ingest/email/route.ts        POST  — inbound-parse webhook (provider-signed)
src/app/api/ingest/whatsapp/route.ts     GET+POST — Meta verification + inbound webhook
src/app/api/ingest/telegram/route.ts     POST  — bot webhook (secret-token header)
src/app/(app)/share/page.tsx             GET/POST — PWA share target receiver
src/app/api/cron/social-mentions/route.ts POST — polls Bluesky + Mastodon notifications (§8, §9)
src/app/.well-known/webfinger/route.ts   GET   — fediverse actor discovery (§9.3)
src/app/api/ap/[org]/actor/route.ts      GET   — ActivityPub actor document
src/app/api/ap/[org]/inbox/route.ts      POST  — signed ActivityPub inbox
```

All ingest routes are unauthenticated in the session sense but authenticated
by channel-native means (provider signatures, webhook secrets, HTTP
Signatures). None of them accept an `x-organisation-id` header — the org is
always resolved from the verified binding, never from the caller.

Vercel constraint: everything is request/response or cron; no long-lived
processes. This shapes the Bluesky design (§8): we poll notifications on a
cron rather than consuming the firehose/Jetstream, which needs a persistent
worker we don't have. ActivityPub, by contrast, is push-based HTTP and fits
serverless perfectly.

### 2.5 Identity matching

New `matchConnectionsByIdentity(organisationId, participants)` in
`src/lib/ingest/identity.ts`:

1. Exact match on `contactDetails` fields (email, phone, bluesky, fediverse,
   telegram) — deterministic, auto-links.
2. Unmatched participants fall through to `understandMoment`'s existing
   name-based suggestion (using `displayName`), surfaced as suggestions in
   the review step, alongside its existing "new connection" proposals.
3. Confirming a suggested link writes the identity back to the connection's
   `contactDetails`, so matching gets deterministic over time.

The capturing user is never linked as a participant connection.

### 2.6 Review & confirmation

- Ingested moments are `status: "suggested"`. They appear in a **Review
  queue** (badge in nav, similar surface to observations) showing parsed
  content, matched/suggested connections, and source link. Actions:
  **Confirm** (→ `captured`), **Edit then confirm**, **Discard**.
- Side effects that are hard to unwind (network strengthening, quality
  inference, thread synthesis, `moment.created` webhook) run **on
  confirmation**, not on ingest. `applyMomentSideEffects` gains a
  `deferred` flag or is simply invoked at confirm time.
- Where the channel supports it, the adapter replies with a short
  confirmation: email auto-reply, WhatsApp/Telegram bot reply, Bluesky/
  Mastodon reply or DM — "Captured ✓ — linked to Amina K. Review: <link>".
  Replies are best-effort and never block ingestion.
- An org-level setting `autoConfirmTrustedChannels` (default off) lets mature
  orgs skip review for deterministic captures (all participants matched, no
  new connections proposed).

### 2.7 Security baseline (all adapters)

- Verify the channel's native signature/secret **before** any parsing:
  provider signature (email), `X-Hub-Signature-256` HMAC (WhatsApp),
  `X-Telegram-Bot-Api-Secret-Token` (Telegram), HTTP Signatures (ActivityPub),
  OAuth/DPoP (Bluesky).
- Treat all inbound content as untrusted: length-cap text (10k chars, same as
  API), strip HTML to text, sanitise, never render raw HTML.
- Attachments: allowlist MIME types (images + audio), size caps, store via the
  existing attachments path.
- Rate-limit per binding (e.g. 60 captures/hour/org) ahead of quota checks.
- Dedupe idempotently (unique `externalRef` index) — every provider redelivers.
- Log ingest failures to a lightweight `ingest_events` table (or reuse
  webhook-delivery-style status) for debuggability; never 500 back to
  providers for content errors (ack 200 and record), only for transient
  faults (so they retry).

---

## 3. Email

**Model:** forward-to-capture and BCC-to-capture.

- Each org gets a capture address shown in Settings → Channels:
  `"{token}@in.tending.network"` where `token` is a readable random slug
  (e.g. `moss-fern-a8c2`), stored in `capture_channels.config`, rotatable
  (rotation deactivates the old address).
- Provider: any inbound-parse service (Resend/Postmark/SendGrid — pick
  whichever already sends Tending's outbound mail). MX for
  `in.tending.network` points at the provider; provider POSTs parsed MIME to
  `/api/ingest/email` with a signature we verify.
- Parsing: prefer `text/plain`; fall back to HTML→text. Strip quoted history
  and signatures (talon-style heuristics; the AI layer tolerates leftovers).
  `externalId` = RFC 5322 `Message-ID`. `occurredAt` = `Date` header.
- Participants: From/To/Cc **minus** the capture address and the forwarder's
  own address. On a *forwarded* email, the original correspondents typically
  live in the forwarded headers inside the body — extraction of
  `From:`-lines in the body is attempted, and `understandMoment` covers the
  rest.
- `capturedByUserId`: matched by the SMTP `From` against org members' account
  emails. **Unknown senders to a valid capture address are recorded but held
  in review with a warning** (the address is a capability token; treat mail
  from non-members as untrusted).
- Attachments: images kept as moment attachments; audio attachments
  transcribed.
- Confirmation: auto-reply from `no-reply@tending.network` with the capture
  summary and review link. Loop protection: never auto-reply to auto-replies
  (`Auto-Submitted`, `Precedence: bulk`), never reply more than once per
  Message-ID.

**Habit to teach:** BCC the capture address when emailing a contact — capture
at the moment of correspondence with zero extra steps.

---

## 4. WhatsApp

**Model:** users forward messages or send voice notes to Tending's WhatsApp
number. One platform-wide number (WhatsApp Business Cloud API), sender
identified by phone.

- Prereqs: Meta Business verification, WhatsApp Business Platform app, one
  phone number, webhook subscription to `messages`. This has lead time —
  start verification early; Telegram (§5) ships first as the same-shaped
  cheap proof.
- Binding: user verifies their mobile number in Settings → Channels (we send
  a code via the WhatsApp number; replying binds it). Creates a
  `user_channel_links` row `{kind: "phone", value: E.164, organisationId}`.
  Users in multiple orgs pick a default; sending the org's name as the first
  line of a message overrides per-capture.
- Webhook (`/api/ingest/whatsapp`): verify `X-Hub-Signature-256` HMAC with
  the app secret; handle Meta's GET challenge. `externalId` = `wamid`.
- Inbound handling:
  - Text → capture text.
  - **Voice note → download media (short-lived Meta media URL) → existing
    transcription path → capture transcript** (audio kept as attachment).
    This is the flagship flow for community organisations.
  - Forwarded messages: WhatsApp does not expose the original sender —
    participants come purely from `understandMoment` on the content. Set
    expectations in the UI copy.
  - Images with captions → attachment + caption text.
- Unknown sender (no `user_channel_links` match): reply once with a short
  "link your number in Tending Settings" message; do not store content.
- Confirmation: bot replies with capture summary + review link.
- 24-hour customer-service window: replies to an inbound message are
  session messages (free-form, no template needed) — our confirmation always
  falls inside it.

---

## 5. Telegram

**Model:** identical shape to WhatsApp, near-zero platform friction. Ships
first among messengers to prove the messaging adapter pattern.

- One bot (`@TendingCaptureBot`) via BotFather. Webhook mode:
  `setWebhook(url, secret_token)`; verify
  `X-Telegram-Bot-Api-Secret-Token` on every POST to
  `/api/ingest/telegram`.
- Binding: Settings → Channels shows a deep link
  `https://t.me/TendingCaptureBot?start={one-time-token}`. The `/start`
  payload binds `telegram user id → user + org` in `user_channel_links`.
  No phone number needed.
- Inbound: text, voice (OGG/Opus → transcription path), photos with
  captions. `externalId` = `"{chat_id}:{message_id}"`.
- **Forwarded messages preserve provenance**: `forward_origin` carries the
  original sender's name (and id, visibility permitting) — feed it into
  `participants` as a `displayName`, giving better matching than WhatsApp.
- Bot replies with capture summary + review link. Unknown senders get the
  bind prompt once.

---

## 6. Signal — position statement

**We do not build a direct Signal integration.** Signal has no official
public bot/API for this use case; the unofficial routes (signal-cli,
libsignal registration of a number) are against Signal's terms, fragile, and
at odds with "open protocols first". Building on them would be a maintenance
and trust liability.

**Signal is served by the PWA share target (§7):** on mobile, Share → Tending
from any Signal message puts the text straight into quick capture. This is
the honest answer for every closed messenger, and it needs zero
Signal-specific code. Revisit only if Signal ships an official API.

---

## 7. PWA Share Target

**Model:** Tending appears in the native share sheet on Android (and
progressively elsewhere). One mechanism covers Instagram, LinkedIn, X,
Signal, iMessage-adjacent apps — every channel we will never get an API for.

- `public/manifest.webmanifest` gains:

```json
{
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title", "text": "text", "url": "url",
      "files": [{ "name": "media", "accept": ["image/*", "audio/*"] }]
    }
  }
}
```

- `/share` (authenticated app page): receives the POST, pre-fills the
  existing quick-capture composer with shared text/URL/images, runs
  `understandMoment` as quick capture already does. Because a human is
  present and reviewing in-composer, these moments are created directly as
  `captured` with `source: "share"` — no review queue.
- Shared URLs: fetch OpenGraph title/description server-side (timeout-capped,
  SSRF-guarded: https only, public DNS, no redirects to private ranges) to
  enrich the content; keep the URL as `externalUrl`.
- iOS Safari doesn't support `share_target`; iOS users are covered by the
  channels above. (A future minimal iOS share extension is out of scope.)
- Prereq: installable PWA (manifest + icons + service worker shell). Keep the
  service worker minimal (no offline sync in this phase).

---

## 8. Bluesky — AT Protocol, done properly

**Model:** each org connects its own Bluesky account via **atproto OAuth**
(no app passwords). Two capture flows: paste/share a post URL, and
opt-in mention/DM watching.

### 8.1 Connection (OAuth)

- Tending is a **confidential atproto OAuth client**: publish a client
  metadata document at
  `https://tending.network/oauth/bsky-client-metadata.json` (client_id is
  that URL), implement PAR (pushed authorization requests), **DPoP**
  proof-of-possession on every token use, and token refresh. Scopes:
  `atproto transition:generic` (and `transition:chat.bsky` only if DM
  capture is enabled).
- Flow: Settings → Channels → "Connect Bluesky" → user enters their handle →
  resolve handle → DID (`com.atproto.identity.resolveHandle` + DID doc) →
  discover the PDS and its authorization server → PAR → user authorises on
  their PDS → callback stores `{did, handle, pdsUrl, tokens}` encrypted in
  `capture_channels.config`.
- All subsequent calls go to **the account's own PDS** (federation-correct —
  works for accounts on any PDS, not just bsky.social), with the public
  AppView (`https://public.api.bsky.app`) used for unauthenticated reads of
  public content.

### 8.2 Capture flows

1. **Share/paste a post** (works with the PWA share target and in-app): given
   a `https://bsky.app/profile/{handle}/post/{rkey}` URL or `at://` URI,
   resolve to the canonical `at://did/app.bsky.feed.post/rkey`, fetch via
   `app.bsky.feed.getPostThread` (public AppView; no auth needed for public
   posts), capture post text + author. `externalId` = at:// URI,
   `externalUrl` = bsky.app URL. Participants: author's DID + handle.
2. **Mentions & replies (opt-in per org):** the `/api/cron/social-mentions`
   cron (every 10 min, matching existing cron cadence) calls
   `app.bsky.notification.listNotifications` with the stored cursor
   (`seenAt`), filters to `mention` and `reply`, and ingests each as a
   suggested moment. This lets fieldworkers capture by simply **mentioning
   the org's account in a post** — "great session with @northside.food.bank
   today" becomes a moment on both sides' consent (public post, explicit
   mention).
3. **DMs (opt-in, later):** poll `chat.bsky.convo.*` (service-proxied) for
   new messages to the org account; same pipeline. Requires the chat scope;
   ship after 1–2 prove out.

Why polling, not the firehose: Jetstream/firehose consumption needs a
persistent connection, which the Vercel runtime can't hold. Notification
polling with a cursor is exactly-once, cheap, serverless-shaped, and
sufficient at 10-minute freshness. If real-time ever matters, a small
external worker (Fly/Railway) can consume Jetstream filtered to
`app.bsky.feed.post` mentioning bound DIDs and POST into `/api/v1/moments` —
the architecture doesn't change.

- Identity: store DIDs (stable), display handles (mutable) in
  `contactDetails.bluesky`; match on either, canonicalise to DID.
- Confirmation for mention-captures: optional reply from the org account
  (off by default — replying publicly is a visible act; per-org setting).

---

## 9. Mastodon / Fediverse — ActivityPub, done properly

Two tiers, shipped in order. Tier 1 is a standard Mastodon-API integration;
Tier 2 makes Tending itself a first-class fediverse citizen.

### 9.1 Tier 1 — Mastodon client API (per-instance OAuth)

- Settings → Channels → "Connect Mastodon" → user enters their instance
  domain → **dynamic app registration** (`POST /api/v1/apps` — apps are
  per-instance; cache client credentials per instance in a small
  `mastodon_instances` table) → standard OAuth 2 authorization-code flow →
  store account tokens encrypted in `capture_channels.config`. Scopes:
  `read:notifications read:statuses` (+ `write:statuses` only if reply
  confirmations enabled).
- Capture flows (mirror Bluesky's):
  1. **Share/paste a status URL** → resolve via
     `GET /api/v2/search?q={url}&resolve=true` on the org's home instance →
     capture status text (HTML→text) + author. `externalId` = status URI
     (the canonical ActivityPub id), `externalUrl` = status URL.
  2. **Mentions (opt-in):** same `/api/cron/social-mentions` cron polls
     `GET /api/v1/notifications?types[]=mention&since_id={cursor}`.
     Mentioning `@org@their.instance` in a toot captures a moment.
  3. **DMs:** Mastodon DMs are just `visibility: direct` statuses — they
     arrive through the same notifications poll. Capture them as suggested
     moments flagged private.
- Works with Mastodon-compatible APIs beyond mastodon.social (Hometown,
  GoToSocial largely compatible); degrade gracefully on missing endpoints.
- Identity: `contactDetails.fediverse` stores `@user@instance`; canonical key
  is the actor URI.

### 9.2 Rate limits & etiquette

Respect per-instance rate limits (300 req/5 min default, headers-driven
backoff); instances are someone's community infrastructure. Set a proper
`User-Agent` (`Tending/1.x (+https://tending.network)`).

### 9.3 Tier 2 — native ActivityPub actor (full federation)

Each org can enable a first-class fediverse actor,
**`@{org-slug}@tending.network`**, followable and mentionable from any
ActivityPub server — no Mastodon account required by the org at all.

- **WebFinger**: `/.well-known/webfinger?resource=acct:{slug}@tending.network`
  → actor URL.
- **Actor document**: `GET /api/ap/{org}/actor` → JSON-LD (`application/
  activity+json`) `Service`/`Group` actor with inbox, outbox, publicKey
  (RSA keypair per actor, generated on enable, private key encrypted in
  `capture_channels.config`).
- **Inbox**: `POST /api/ap/{org}/inbox` — verify **HTTP Signatures**
  (draft-cavage as deployed by Mastodon; fetch and cache the remote actor's
  public key), then handle:
  - `Create(Note)` mentioning the actor, and direct Notes → **ingest as a
    suggested moment** (this is the capture path: anyone in the fediverse can
    send a moment to the org by mentioning or DMing its Tending actor).
  - `Follow` → auto-`Accept` (signed POST back to the follower's inbox).
  - `Delete`/`Undo` → honour: if a fediverse Note that became a moment is
    deleted upstream, flag the moment in review (don't silently delete
    org data; show provenance-revoked state).
- **Outbox/delivery**: minimal — `Accept` activities and (optional)
  confirmation replies, delivered as signed POSTs through the existing
  webhook-delivery-style retry queue (reuse the `webhookDeliveries` pattern
  with a new delivery kind rather than a parallel mechanism).
- ActivityPub is push-based HTTP — **a perfect fit for serverless**, unlike
  firehose consumption. Inbox POSTs arrive like any webhook.
- Non-goals for Tier 2 (explicitly out of scope): publishing org content to
  the fediverse, follower timelines, boosts/likes, Mastodon-compatible
  client API on tending.network. The actor exists to *receive*, accept
  follows, and reply confirmations — a capture endpoint with a face, not a
  social platform.

Tier 2 risk note: HTTP Signature interop across fediverse software is the
known hard part (key formats, `(created)` vs `date`, RFC 9421 migration).
Budget test time against Mastodon, GoToSocial, and Pleroma; keep Tier 1 as
the fallback path for orgs where interop bites.

---

## 10. Privacy & data protection

- **Lawful basis / roles:** the org is data controller for captured content;
  Tending is processor. Channel capture is off by default and enabled
  per-channel by an org admin (Settings → Channels).
- **Third-party data:** forwarded emails and messages contain other people's
  personal data. Mitigations: deliberate-capture-only (a human chose this
  content), review queue before it joins the narrative, visible provenance,
  and the existing export/delete paths (`/api/v1/export`, cascade deletes)
  covering ingested moments identically to manual ones.
- **Public-post nuance:** a public toot/skeet is still personal data.
  Capture only on explicit share or explicit mention of the org's account —
  never keyword search or timeline monitoring. Honour upstream `Delete`
  activities (§9.3).
- **Storage minimisation:** `raw` payloads trimmed to what the extraction
  needs; provider media URLs (WhatsApp) fetched once, stored in our storage,
  provider copy expires. Discarded suggestions purge content after 14 days
  (cron).
- **Secrets:** all channel tokens/keys encrypted at rest; never in logs;
  webhook payload logging redacts message bodies.
- Update the privacy policy and org-facing copy per channel before each
  channel GA.

---

## 11. Build phases

| Phase | Ships | Depends on |
|---|---|---|
| **1** | Shared pipeline (`src/lib/ingest/`), schema (enums, `moments.status`/`externalRef`, `capture_channels`, `user_channel_links`), review queue UI, **Email** adapter | inbound email provider config, `in.tending.network` MX |
| **2** | **PWA share target** (manifest, `/share` page, installability) | none |
| **3** | **Telegram** bot (binding flow, webhook, voice transcription) | BotFather setup |
| **4** | **Bluesky**: atproto OAuth client, paste/share capture, mentions cron | OAuth client metadata hosting |
| **5** | **Mastodon Tier 1**: per-instance OAuth, paste/share capture, mentions in shared cron | none |
| **6** | **WhatsApp** Cloud API adapter (phone binding, voice notes) | Meta business verification (start during Phase 1 — longest lead time) |
| **7** | **ActivityPub Tier 2**: WebFinger, org actors, signed inbox, Accept/Delete handling | Phases 1 & 5 learnings |

Each phase lands behind an org-level channel toggle; nothing is on by
default. Signal ships as documentation ("use Share → Tending"), not code.

## 12. Open questions

1. Inbound email provider: consolidate on the current outbound provider, or
   pick Postmark for its superior inbound parsing?
2. Review queue placement: its own nav item, or folded into the observations
   surface as a "suggested moments" section?
3. Should mention-capture (Bluesky/Mastodon) be per-space routable — e.g.
   hashtags in the post mapping to spaces?
4. Multi-org users on messaging channels: is "first line = org name"
   override enough, or do we need a bot-side org picker?
5. Tier 2 actor type: `Service` (bot-flagged in Mastodon UI, honest) vs
   `Person`/`Group` (better visibility in some clients)?
6. Does channel capture count against the same moment quota 1:1, or do
   suggested-but-discarded moments not count?
