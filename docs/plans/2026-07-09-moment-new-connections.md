# Detect & add new connections from moments — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Surface people/orgs a moment mentions but that aren't yet connections as confirmable "add" chips in the composer; confirmed ones are created (with an AI-suggested, user-overridable type) and linked when the moment is planted.

**Architecture:** The AI already returns `entities` with `connectionId: null` for new mentions — extend it to also suggest a `type`. A pure guard (`newConnectionSuggestions`) filters those into safe suggestions (drops fuzzy-duplicates of existing connections + generic references). The composer renders them as chips whose default selected state comes from an org setting (opt-in/opt-out); on plant it creates the selected ones via the existing `/api/connections` endpoint and links them to the moment.

**Tech Stack:** Next.js 15, Drizzle, Vitest, `zod/v3`. Reference design: `docs/plans/2026-07-09-moment-new-connections-design.md`.

**Testing note:** No test DB — the `newConnectionSuggestions` guard is a pure function TDD'd with Vitest; the AI-schema change is verified with a live repro; composer/settings are verified by build + manual smoke.

---

## Task 1: Extend the AI entity schema + prompt

**Files:** Modify `src/lib/ai/moment-understanding.ts`.

**Step 1:** Add `type` to `entityMentionSchema`:
```ts
const entityMentionSchema = z.object({
  name: z.string(),
  connectionId: z.string().uuid().nullable(),
  type: z
    .enum(["person", "organisation", "group", "community"])
    .nullable()
    .describe("best guess at the kind of entity; null if genuinely unsure"),
});
```

**Step 2:** Extend `buildPrompt` instruction 1 to also: infer `type` for each entity; **prefer matching an existing roster connection** before marking something new (avoid inventing near-duplicates); only extract *named* people/orgs/groups — skip generic references ("the council", "my manager"). Keep it consistent with the existing prose; no `.min/.max`.

**Step 3: Verify with a live repro** (mirror `repro-*` scripts used earlier): call `generateObject` with the extended schema on *"Bumped into Amara Okafor and someone from Sheffield Food Network at the allotment; also spoke to the council"*. Confirm: Amara → `{connectionId: null, type: "person"}`, Sheffield Food Network → `type: "organisation"`, "the council" is NOT returned as a named entity (or returned without inventing a spurious connection). Run against the real OpenRouter key from `.env.local`, delete the throwaway script after.

**Step 4:** `npx tsc --noEmit` clean.

**Step 5: Commit** `feat(moments): AI suggests a type for mentioned entities`

---

## Task 2: The suggestion guard (pure, TDD)

**Files:** Create `src/lib/moments/new-connections.ts` + `new-connections.test.ts`.

**Step 1: Write the failing test.** `newConnectionSuggestions(entities, roster)` where `entities: { name, connectionId, type }[]` and `roster: { id, name }[]`:
```ts
import { describe, it, expect } from "vitest";
import { newConnectionSuggestions } from "./new-connections";

const roster = [{ id: "c1", name: "Amara Okafor" }];

describe("newConnectionSuggestions", () => {
  it("keeps only genuinely new, named entities", () => {
    const out = newConnectionSuggestions(
      [
        { name: "Bramble Trust", connectionId: null, type: "organisation" },
        { name: "Amara Okafor", connectionId: "c1", type: "person" }, // existing
      ],
      roster,
    );
    expect(out).toEqual([{ name: "Bramble Trust", type: "organisation" }]);
  });

  it("drops a new mention that fuzzy-matches an existing connection", () => {
    // "Amara" should not be suggested when "Amara Okafor" exists.
    const out = newConnectionSuggestions(
      [{ name: "Amara", connectionId: null, type: "person" }],
      roster,
    );
    expect(out).toEqual([]);
  });

  it("de-dupes repeated names within one moment (normalised)", () => {
    const out = newConnectionSuggestions(
      [
        { name: "Bramble Trust", connectionId: null, type: "organisation" },
        { name: "  bramble   trust ", connectionId: null, type: null },
      ],
      [],
    );
    expect(out).toHaveLength(1);
  });

  it("defaults a null type to person", () => {
    const out = newConnectionSuggestions(
      [{ name: "Sam", connectionId: null, type: null }],
      [],
    );
    expect(out).toEqual([{ name: "Sam", type: "person" }]);
  });
});
```

**Step 2:** Run → FAIL. **Step 3:** Implement. Normalisation: `lower + trim + collapse whitespace`. A suggestion is dropped when its normalised name equals, or is contained by / contains, any roster connection's normalised name (guards the "Amara" vs "Amara Okafor" case both directions). De-dupe by normalised name. `type ?? "person"`. **Step 4:** Run → PASS. `npx tsc --noEmit` clean.

**Step 5: Commit** `feat(moments): pure guard for new-connection suggestions`

---

## Task 3: Org setting + toggle

**Files:** the org settings type (`src/lib/db/schema/organisations.ts` `settings` `$type`, or wherever the settings shape is declared), a settings UI toggle component, and the org-settings update path.

**Step 1:** Add `newConnectionSuggestions?: "opt_in" | "opt_out"` to the org `settings` type (default treated as `"opt_in"` when absent — do NOT require a migration; it's jsonb).

**Step 2:** Find how org settings are updated today (check for an existing org PATCH/settings route, e.g. under `src/app/api/organisations/`). Reuse it if present; otherwise add a minimal admin-gated `PATCH` that merges the one key into `organisations.settings` (org-scoped via `getOrgContext`). Report which path you used.

**Step 3:** Add a toggle to the settings page (`settings/page.tsx` or a small section), admin+ or contributor+ (your call — it's a workflow preference; contributor+ is fine): *"When a moment mentions someone new — [Ask before adding] / [Pre-select to add]"*, persisting via Step 2.

**Step 4:** `npx tsc --noEmit`, `npm run lint`, `npm run build` clean.

**Step 5: Commit** `feat(settings): opt-in/opt-out preference for new-connection suggestions`

---

## Task 4: Composer — render suggestion chips

**Files:** Modify `src/components/moments/moment-composer-modal.tsx`. The composer needs the org's `newConnectionSuggestions` mode — thread it in the simplest working way (a prop from the composer provider, or fetch alongside the roster load); default `"opt_in"` if unavailable.

**Step 1:** Derive `suggestions = newConnectionSuggestions(understanding?.entities ?? [], rosterConnections)`.

**Step 2:** Local state: a `Map<normalisedName, { name, type, selected }>` seeded from `suggestions`, with the default `selected` = (mode === "opt_out"), and a `touched` guard so later understanding passes don't clobber user edits (mirror the follow-up chip's pattern). Each entry: an inline `<select>` for the four types (pre-filled from the suggestion), and an add/remove toggle.

**Step 3:** Render the chips beneath the recognised-entities row. Reset them in `resetAndClose`.

**Step 4:** `npx tsc --noEmit`, `npm run lint`, `npm run build` clean; visually reasonable.

**Step 5: Commit** `feat(moments): show add-suggestion chips for new mentions in the composer`

---

## Task 5: Create selected suggestions on plant

**Files:** Modify `handlePlantIt` in `moment-composer-modal.tsx`.

**Step 1:** After the flush-on-plant understanding settles and before the `POST /api/moments`, for each **selected** suggestion: `POST /api/connections` with `{ name, type }` and the `x-organisation-id` header; collect the returned connection ids. Wrap each create in try/catch — a single failure is skipped (don't abort the plant), optionally surfacing a subtle inline note.

**Step 2:** Include the newly-created ids in the moment POST's `connectionIds` (alongside the recognised existing ids).

**Step 3:** `router.refresh()` already runs on success, surfacing the new connections + moment. Verify `npx tsc --noEmit`, `npm run lint`, `npm run build` clean.

**Step 4: Commit** `feat(moments): create & link confirmed new connections when planting`

---

## Task 6: Final verification

- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` — all green.
- Manual smoke (running app, authenticated): write a moment naming a new person + a new org; confirm chips appear (default per the setting), the type dropdown works, planting creates + links both connections (and fires `connection.created`), and a near-duplicate of an existing name is NOT suggested. Flip the setting and confirm the default selection flips.
- Update `STATE.md`.
- Fresh-eyes review of the diff (data-integrity: no duplicate/junk connections; nothing created unless planted; org-scoping on the create calls).

## Out of scope
- Per-user preference; a new atomic server-side create-moment-with-connections path; enriching new connections with contact details from the text.
