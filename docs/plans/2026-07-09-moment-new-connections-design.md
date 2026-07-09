# Detect & add new connections from moments — design

> Status: Approved design (brainstorm) · 2026-07-09
> Branch: `feat/moment-new-connections`

## Context

When someone records a moment, the AI understanding already extracts **every** entity mentioned — with `connectionId: null` for anyone not on the org's roster (the prompt explicitly asks for this). But the composer discards those: both entity-merge sites (`moment-composer-modal.tsx` ~L250 and ~L296) do `.map(e => e.connectionId).filter(Boolean)`, so **new people/organisations are recognised and then silently dropped**. Only pre-existing connections get linked.

This feature surfaces those new mentions as **confirmable "add" suggestions** in the composer, so "bumped into Amara Okafor at the allotment" can become a tracked relationship without leaving the compose flow — while protecting against junk/duplicate connections.

## Decisions (locked)

- **Confirmable, not auto-create.** New mentions appear as chips the user acts on.
- **Default is opt-in, switchable to opt-out**, via an **org-level setting** (`organisations.settings`). Opt-in: chips start unselected (tap to add). Opt-out: chips start selected (✕ to skip).
- **AI suggests the type** (person/organisation/group/community); the user can override it on the chip.
- **Creation is deferred to plant** — nothing is created unless the moment is planted.
- **Reuse the existing connection-create endpoint** (client-side) rather than a new atomic server path — so new connections fire `connection.created` + quality/thread machinery for free.
- **Layered safety guard** prevents near-duplicates and generic references becoming connections.

## Design

### 1. AI schema + prompt — `src/lib/ai/moment-understanding.ts`
Extend `entityMentionSchema`:
```ts
const entityMentionSchema = z.object({
  name: z.string(),
  connectionId: z.string().uuid().nullable(),
  type: z.enum(["person", "organisation", "group", "community"]).nullable()
    .describe("best guess at what kind of entity this is; null if unsure"),
});
```
`buildPrompt` gains: (a) infer `type` for each entity; (b) **prefer matching an existing roster connection** before deciding something is new (avoids inventing near-duplicates); (c) only extract *named* people/orgs/groups — skip generic references ("the council", "my manager"). No `.min/.max` (Anthropic structured-output constraint).

### 2. Safety guard (pure, TDD) — `src/lib/moments/new-connections.ts`
`newConnectionSuggestions(entities, roster): { name, type }[]`:
- keep only entities with `connectionId: null`,
- **drop any whose normalized name fuzzy-matches an existing roster connection** (lowercase + trim + collapse whitespace; reject on equality or containment either direction) — the core dedupe-prevention step,
- de-dupe repeated names within the moment (normalized),
- default a null `type` to `"person"`.
Pure function of `(entities, roster)` → fully unit-testable without a DB.

### 3. Composer UX — `src/components/moments/moment-composer-modal.tsx`
- Compute `suggestions` from `understanding.entities` via the guard, against the loaded roster.
- Render a chip per suggestion beneath the recognised-entities row:
  `🌱 <name> · new · [ Add as <type ▾> ]` — the type is an inline `<select>` pre-filled with the AI's guess and overridable.
- Selected state initialises from the org setting (opt-in → unselected; opt-out → selected); user toggles each; a `touched` guard stops re-seeding from later understanding passes (mirrors the follow-up chip).
- Integrate with the existing **flush-on-plant** so a fast "Plant it" still captures suggestions.

### 4. Creation on plant — `handlePlantIt`
For each **selected** suggestion: `POST /api/connections { name, type }` (reuses `createConnectionSchema`), collect the returned ids, then `POST /api/moments` with `connectionIds = [recognised existing ids, ...new ids]`. A single failed connection-create is skipped (plant continues with the rest) — benign, since nothing is created unless the user planted. Reuses the connection endpoint's org-scoping, validation, and `connection.created` webhook.

### 5. Settings — org preference
`organisations.settings.newConnectionSuggestions: "opt_in" | "opt_out"` (default `"opt_in"`). A toggle on the settings page: *"When a moment mentions someone new — Ask before adding / Pre-select to add."* Read by the composer (passed as a prop from the server page, or fetched with the roster).

## Error handling
- No AI / empty guard → no chips (silent degrade; unchanged behavior).
- Connection-create failure on plant → skip that suggestion, still plant; surface a subtle inline note.
- Fuzzy-dedup + within-moment dedupe keep duplicates out.

## Testing
- **`newConnectionSuggestions` guard** (pure, primary): fuzzy-match drop (e.g. "Amara" vs existing "Amara Okafor"), within-moment dedupe, null-type → person, generic-name handling.
- **Live AI repro**: confirm the model returns a sensible `type` for new entities and still nulls `connectionId` only for genuinely new ones.
- **Component**: chip render, type override, selection toggle, and that `handlePlantIt` includes created ids.

## Out of scope
- Per-user (vs org) preference — no per-user store today.
- A new atomic server-side "create moment + new connections" path (client-side reuse chosen for simplicity).
- Enriching new connections with contact details from the moment text (future).
