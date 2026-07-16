"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EntityRecognitionOverlay } from "./entity-recognition-overlay";
import { VoiceCaptureButton } from "./voice-capture-button";
import { Filaments } from "@/components/network/filaments";
import { Spores } from "@/components/network/spores";
import {
  matchEntities,
  distinctEntities,
  type RosterEntry,
} from "@/lib/moments/recognition";
import {
  newConnectionSuggestions,
  type ConnectionType,
} from "@/lib/moments/new-connections";
import type { MomentUnderstanding } from "@/lib/ai/moment-understanding";

interface MomentComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisationId: string;
  /** Pre-seed the text (e.g. a connection's name from its story page). */
  seedText?: string;
  /**
   * Org preference for how "add new connection" chips start out.
   * `"opt_in"` (default) = chips start unselected (ask first);
   * `"opt_out"` = chips start pre-selected (add unless deselected).
   */
  newConnectionSuggestionsMode?: "opt_in" | "opt_out";
}

/** The user's decision about one suggested new connection, keyed by name. */
interface NewConnectionChoice {
  name: string;
  type: ConnectionType;
  selected: boolean;
}

const CONNECTION_TYPE_OPTIONS: ConnectionType[] = [
  "person",
  "organisation",
  "group",
  "community",
];

/** Lowercase/trim/collapse-whitespace key for a suggestion name (mirrors the guard). */
function normaliseName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

interface RosterConnection {
  id: string;
  name: string;
  type: string;
}

interface RosterSpace {
  id: string;
  name: string;
}

// Presentational only — moments have no type/category column today, so this
// doesn't write anywhere yet. Kept for visual parity with the design; wiring
// it to a real field is a separate follow-up.
const MOMENT_TYPE_CHIPS = [
  "Growing trust",
  "First meeting",
  "Working together",
  "A wobble",
];

const UNDERSTAND_DEBOUNCE_MS = 600;

/** ISO date/string → the yyyy-mm-dd a <input type="date"> expects. */
function toDateInput(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** "Tue 15 Jul" — a light, friendly rendering of a reminder's due date. */
function formatFollowUpDate(dateInput: string): string {
  if (!dateInput) return "";
  // dateInput is a plain yyyy-mm-dd. Parse the parts as a LOCAL calendar date:
  // `new Date("2026-07-15")` parses as UTC midnight, which renders as the day
  // before in timezones west of UTC (e.g. America/New_York).
  const [year, month, day] = dateInput.split("-").map(Number);
  if (!year || !month || !day) return "";
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** "1 person", "2 people and 1 space", "1 organisation, 1 space" … */
function describeRecognised(
  connections: RosterConnection[],
  spaceCount: number
): string {
  const personCount = connections.filter((c) => c.type === "person").length;
  const orgCount = connections.length - personCount;
  const parts: string[] = [];
  if (personCount)
    parts.push(`${personCount} ${personCount === 1 ? "person" : "people"}`);
  if (orgCount)
    parts.push(
      `${orgCount} ${orgCount === 1 ? "organisation" : "organisations"}`
    );
  if (spaceCount)
    parts.push(`${spaceCount} ${spaceCount === 1 ? "space" : "spaces"}`);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}

export function MomentComposerModal({
  open,
  onOpenChange,
  organisationId,
  seedText,
  newConnectionSuggestionsMode = "opt_in",
}: MomentComposerModalProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [rosterConnections, setRosterConnections] = useState<
    RosterConnection[]
  >([]);
  const [rosterSpaces, setRosterSpaces] = useState<RosterSpace[]>([]);
  const [understanding, setUnderstanding] =
    useState<MomentUnderstanding | null>(null);
  const [usedVoice, setUsedVoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A non-fatal notice shown after a successful plant (e.g. some suggested
  // connections couldn't be created) — distinct from the destructive `error`.
  const [notice, setNotice] = useState<string | null>(null);
  // The follow-up reminder the composer will plant alongside the moment. Seeded
  // from the AI's detection, but once the user edits or removes it, `touched`
  // stops the debounced understanding from re-seeding over their choice.
  const [followUp, setFollowUp] = useState<{
    note: string;
    date: string;
  } | null>(null);
  const [followUpTouched, setFollowUpTouched] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(false);
  // The user's decisions about suggested new connections, keyed by normalised
  // name. Seeded from the AI's detection; `newConnectionChoicesTouched` stops a
  // later understanding pass re-seeding over an edit (mirrors followUpTouched).
  // The LATER "create on plant" task reads `newConnectionChoices`.
  const [newConnectionChoices, setNewConnectionChoices] = useState<
    Record<string, NewConnectionChoice>
  >({});
  const [newConnectionChoicesTouched, setNewConnectionChoicesTouched] =
    useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rosterLoadedFor = useRef<string | null>(null);
  // The exact text the current `understanding` was computed for — lets
  // "Plant it" tell whether it needs a final flush before submitting.
  const understoodContentRef = useRef<string | null>(null);

  // Seed the text when opening from a context that knows who it's about
  // (e.g. "Add moment" on a connection page) — recognition picks the name
  // up immediately. Never clobbers text the user has already written.
  useEffect(() => {
    if (open && seedText) {
      setContent((prev) => (prev === "" ? `${seedText} ` : prev));
    }
  }, [open, seedText]);

  // Load the recognisable roster (connections + spaces) once per org when
  // the composer first opens — this is what makes recognition instant and
  // independent of the AI providers.
  useEffect(() => {
    if (!open || rosterLoadedFor.current === organisationId) return;
    const headers = { "x-organisation-id": organisationId };
    (async () => {
      try {
        const [connRes, spaceRes] = await Promise.all([
          fetch("/api/connections?limit=100", { headers }),
          fetch("/api/spaces?limit=100", { headers }),
        ]);
        if (connRes.ok) {
          const json = await connRes.json();
          setRosterConnections(
            (json.data.items as RosterConnection[]).map(
              ({ id, name, type }) => ({ id, name, type })
            )
          );
        }
        if (spaceRes.ok) {
          const json = await spaceRes.json();
          setRosterSpaces(
            (json.data.items as RosterSpace[]).map(({ id, name }) => ({
              id,
              name,
            }))
          );
        }
        rosterLoadedFor.current = organisationId;
      } catch {
        // Roster fetch failing just means no inline chips — writing still works.
      }
    })();
  }, [open, organisationId]);

  const roster = useMemo<RosterEntry[]>(
    () => [
      ...rosterConnections.map((c) => ({
        id: c.id,
        name: c.name,
        kind: "connection" as const,
      })),
      ...rosterSpaces.map((s) => ({
        id: s.id,
        name: s.name,
        kind: "space" as const,
      })),
    ],
    [rosterConnections, rosterSpaces]
  );

  // Instant, deterministic recognition on every keystroke.
  const matches = useMemo(
    () => matchEntities(content, roster),
    [content, roster]
  );
  const recognised = useMemo(() => distinctEntities(matches), [matches]);

  // New people/orgs/groups the AI spotted that aren't existing connections.
  // The guard drops near-duplicates and generics, so this is safe to surface.
  const suggestions = useMemo(
    () =>
      newConnectionSuggestions(
        understanding?.entities ?? [],
        rosterConnections
      ),
    [understanding, rosterConnections]
  );

  const connectionById = useMemo(
    () => new Map(rosterConnections.map((c) => [c.id, c])),
    [rosterConnections]
  );
  const recognisedConnectionIds = recognised
    .filter((e) => e.kind === "connection")
    .map((e) => e.id);
  const recognisedSpaceIds = recognised
    .filter((e) => e.kind === "space")
    .map((e) => e.id);

  // One AI understanding round-trip. Sends the user's timezone so relative
  // dates ("today", "next week") resolve against their calendar day. Records
  // the text it ran for and returns the result so "Plant it" can flush it.
  const runUnderstanding = useCallback(
    async (text: string): Promise<MomentUnderstanding | null> => {
      try {
        const res = await fetch("/api/moments/understand", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-organisation-id": organisationId,
          },
          body: JSON.stringify({
            content: text,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setUnderstanding(data.data);
          understoodContentRef.current = text;
          return data.data as MomentUnderstanding;
        }
      } catch {
        // Recognition already happened locally; AI is a bonus.
      }
      return null;
    },
    [organisationId]
  );

  // AI enhancement, best-effort and silent: catches mentions the literal
  // text search can't ("the food network" → Sheffield Food Network) and
  // detects event dates. Never blocks or breaks the composer.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!content.trim()) {
      setUnderstanding(null);
      understoodContentRef.current = null;
      return;
    }
    debounceRef.current = setTimeout(() => {
      runUnderstanding(content);
    }, UNDERSTAND_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, runUnderstanding]);

  // Seed the follow-up chip from the AI's detection, but never clobber a
  // reminder the user has already edited or dismissed (the understanding call
  // re-fires on every keystroke). `dueDate` arrives as an ISO string over JSON.
  useEffect(() => {
    if (followUpTouched) return;
    const detected = understanding?.followUp ?? null;
    setFollowUp(
      detected
        ? { note: detected.note, date: toDateInput(detected.dueDate) }
        : null
    );
  }, [understanding, followUpTouched]);

  // Seed the new-connection chips from the AI's suggestions, but never clobber
  // choices the user has already made — the understanding call re-fires on every
  // keystroke. Default `selected` follows the org's opt_in/opt_out preference.
  useEffect(() => {
    if (newConnectionChoicesTouched) return;
    setNewConnectionChoices(
      Object.fromEntries(
        suggestions.map((suggestion) => [
          normaliseName(suggestion.name),
          {
            name: suggestion.name,
            type: suggestion.type,
            selected: newConnectionSuggestionsMode === "opt_out",
          },
        ])
      )
    );
  }, [suggestions, newConnectionChoicesTouched, newConnectionSuggestionsMode]);

  const aiExtraConnectionIds = (understanding?.entities ?? [])
    .map((e) => e.connectionId)
    .filter(
      (id): id is string =>
        Boolean(id) && !recognisedConnectionIds.includes(id!)
    );

  const allRecognisedConnections = [
    ...recognisedConnectionIds,
    ...aiExtraConnectionIds,
  ]
    .map((id) => connectionById.get(id))
    .filter((c): c is RosterConnection => Boolean(c));

  const recognisedSummary = describeRecognised(
    allRecognisedConnections,
    recognisedSpaceIds.length
  );

  /** Reset every field/selection — used both on close and after a partial-
   *  success plant (which keeps the modal open to show a notice). */
  function clearComposer() {
    setContent("");
    setUnderstanding(null);
    setSelectedType(null);
    setUsedVoice(false);
    setError(null);
    setFollowUp(null);
    setFollowUpTouched(false);
    setEditingFollowUp(false);
    setNewConnectionChoices({});
    setNewConnectionChoicesTouched(false);
  }

  function resetAndClose() {
    clearComposer();
    setNotice(null);
    onOpenChange(false);
  }

  async function handlePlantIt() {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    // Flush pending AI understanding: if "Plant it" is clicked before the
    // debounced call has run for this exact text, run it now (and wait) so the
    // reminder + event date aren't lost to the race. No-op once understood.
    const effective =
      understoodContentRef.current === content
        ? understanding
        : await runUnderstanding(content);

    // Merge the AI's extra connections (e.g. "the food network") with the
    // instant local recognition, using whichever understanding we just settled.
    const aiExtraIds = (effective?.entities ?? [])
      .map((e) => e.connectionId)
      .filter(
        (id): id is string =>
          Boolean(id) && !recognisedConnectionIds.includes(id!)
      );
    const recognisedIds = [...recognisedConnectionIds, ...aiExtraIds]
      .map((id) => connectionById.get(id))
      .filter((c): c is RosterConnection => Boolean(c))
      .map((c) => c.id);

    // Reconcile the confirmed new-connection chips with the freshly-flushed
    // detection so a fast "Plant it" (before the 600ms debounce) still captures
    // new names — mirroring the follow-up flush above. For each detected
    // suggestion, the user's explicit choice wins; otherwise the org default
    // applies (opt_out pre-selects, opt_in does not).
    const selectedNewConnections = newConnectionSuggestions(
      effective?.entities ?? [],
      rosterConnections
    )
      .map(
        (suggestion) =>
          newConnectionChoices[normaliseName(suggestion.name)] ?? {
            name: suggestion.name,
            type: suggestion.type,
            selected: newConnectionSuggestionsMode === "opt_out",
          }
      )
      .filter((choice) => choice.selected);

    // Create each confirmed connection and link it to this moment. Best-effort:
    // a single failure is skipped (never aborts the plant) but is collected so
    // we can tell the user which ones didn't make it.
    const createdConnectionIds: string[] = [];
    const failedNewConnections: string[] = [];
    for (const choice of selectedNewConnections) {
      try {
        const res = await fetch("/api/connections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-organisation-id": organisationId,
          },
          body: JSON.stringify({ name: choice.name, type: choice.type }),
        });
        if (!res.ok) {
          failedNewConnections.push(choice.name);
          continue;
        }
        const created = await res.json();
        if (created?.data?.id) createdConnectionIds.push(created.data.id);
      } catch {
        failedNewConnections.push(choice.name);
      }
    }

    // Merge recognised + freshly-created ids, de-duplicated, for the moment link.
    const connectionIds = [
      ...new Set([...recognisedIds, ...createdConnectionIds]),
    ];

    // The user's edited/removed chip wins once touched; otherwise use the
    // freshly detected follow-up (which the flush above guarantees is current).
    const effectiveFollowUp = followUpTouched
      ? followUp && followUp.note.trim() && followUp.date
        ? { note: followUp.note.trim(), dueDate: followUp.date }
        : undefined
      : effective?.followUp
        ? {
            note: effective.followUp.note,
            dueDate: toDateInput(effective.followUp.dueDate),
          }
        : undefined;

    try {
      const res = await fetch("/api/moments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organisation-id": organisationId,
        },
        body: JSON.stringify({
          content,
          source: usedVoice ? "voice" : "quick_capture",
          connectionIds,
          spaceId:
            recognisedSpaceIds.length === 1 ? recognisedSpaceIds[0] : undefined,
          eventDate: effective?.eventDate ?? undefined,
          followUp: effectiveFollowUp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.refresh();
      if (failedNewConnections.length > 0) {
        // The moment landed, but some confirmed connections couldn't be created.
        // Clear the fields (so the same moment can't be re-planted) but keep the
        // modal open with a note so the user knows to add them manually.
        clearComposer();
        setNotice(
          `Moment planted — but couldn't add ${failedNewConnections.join(
            ", "
          )}. You can add ${failedNewConnections.length === 1 ? "it" : "them"} from Connections.`
        );
      } else {
        resetAndClose();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetAndClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="bg-cream [&>button]:text-soil-ink-soft max-w-[640px] overflow-hidden rounded-3xl border-none p-0 shadow-[0_40px_100px_rgba(27,19,10,0.5)] [&>button]:opacity-80 [&>button]:hover:opacity-100">
        <div className="underground relative h-[86px] overflow-hidden rounded-none border-none">
          <Filaments width={640} height={86} count={5} seed={3} />
          <Spores count={3} seed={3} />
          <DialogTitle className="font-display text-soil-ink absolute bottom-4 left-6 text-2xl font-normal">
            Plant a moment
          </DialogTitle>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive mb-3 rounded-lg border p-3 text-sm"
            >
              {error}
            </div>
          )}

          {notice && (
            <div
              role="status"
              aria-live="polite"
              className="border-amber/30 bg-amber/10 text-amber-dark mb-3 rounded-lg border p-3 text-sm"
            >
              {notice}
            </div>
          )}

          <EntityRecognitionOverlay
            value={content}
            onChange={setContent}
            entities={matches}
            placeholder="Bumped into Amara Okafor at the Community Allotment — she offered to introduce me to the council food team…"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handlePlantIt();
              }
            }}
          />

          <div className="mt-3 flex min-h-9 items-center justify-between gap-3">
            {content.trim().length > 0 ? (
              <div className="text-muted flex items-center gap-2 text-xs">
                <span className="animate-glow bg-moss h-[7px] w-[7px] shrink-0 rounded-full" />
                {recognisedSummary
                  ? `tending recognised ${recognisedSummary} — new threads will grow from this moment`
                  : "mention people, organisations or spaces by name and tending will recognise them"}
              </div>
            ) : (
              <span />
            )}
            <VoiceCaptureButton
              organisationId={organisationId}
              onTranscript={(text) => {
                setUsedVoice(true);
                setContent((prev) => (prev ? `${prev} ${text}` : text));
              }}
            />
          </div>

          {followUp && (
            <div className="border-amber/30 bg-amber/5 mt-3 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2">
              <span aria-hidden="true">🔔</span>
              {editingFollowUp ? (
                <>
                  <input
                    type="text"
                    value={followUp.note}
                    onChange={(e) => {
                      setFollowUpTouched(true);
                      setFollowUp((prev) =>
                        prev ? { ...prev, note: e.target.value } : prev
                      );
                    }}
                    placeholder="What to check in about"
                    className="border-border text-bark placeholder:text-muted-light focus:border-amber focus-visible:ring-terracotta min-w-0 flex-1 rounded-lg border bg-white px-2.5 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
                  />
                  <input
                    type="date"
                    value={followUp.date}
                    onChange={(e) => {
                      setFollowUpTouched(true);
                      setFollowUp((prev) =>
                        prev ? { ...prev, date: e.target.value } : prev
                      );
                    }}
                    className="border-border text-bark focus:border-amber focus-visible:ring-terracotta rounded-lg border bg-white px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingFollowUp(false)}
                    className="bg-amber/20 text-amber-dark hover:bg-amber/30 rounded-lg px-2.5 py-1 text-xs font-semibold"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <span className="text-bark min-w-0 flex-1 text-sm">
                    <span className="text-muted">Reminder:</span>{" "}
                    {followUp.note}
                    {followUp.date && (
                      <span className="text-amber-dark">
                        {" · "}
                        {formatFollowUpDate(followUp.date)}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingFollowUp(true)}
                    className="text-muted hover:text-bark text-xs font-medium"
                  >
                    edit
                  </button>
                  <button
                    type="button"
                    aria-label="Remove reminder"
                    onClick={() => {
                      setFollowUpTouched(true);
                      setFollowUp(null);
                      setEditingFollowUp(false);
                    }}
                    className="text-muted hover:text-terracotta-dark transition-colors"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="border-moss/25 bg-moss/5 mt-3 flex flex-col gap-2 rounded-xl border px-3 py-2.5">
              <p className="text-muted text-xs">
                New here — add {suggestions.length === 1 ? "this" : "these"} as
                {suggestions.length === 1 ? " a connection" : " connections"}?
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => {
                  const key = normaliseName(suggestion.name);
                  const choice = newConnectionChoices[key];
                  // Fall back to the suggestion until the seeding effect fills state.
                  const selected = choice?.selected ?? false;
                  const type = choice?.type ?? suggestion.type;
                  return (
                    <div
                      key={key}
                      className={
                        selected
                          ? "border-green/40 bg-green/15 flex items-center gap-1.5 rounded-full border py-1 pr-1.5 pl-3"
                          : "border-border-strong flex items-center gap-1.5 rounded-full border bg-white py-1 pr-1.5 pl-3"
                      }
                    >
                      <span className="text-bark text-sm">
                        {suggestion.name}
                      </span>
                      <select
                        aria-label={`Type for ${suggestion.name}`}
                        value={type}
                        onChange={(e) => {
                          setNewConnectionChoicesTouched(true);
                          setNewConnectionChoices((prev) => ({
                            ...prev,
                            [key]: {
                              name: suggestion.name,
                              type: e.target.value as ConnectionType,
                              selected: prev[key]?.selected ?? selected,
                            },
                          }));
                        }}
                        className="border-border bg-cream text-bark-light focus:border-moss focus-visible:ring-terracotta rounded-md border px-1.5 py-0.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
                      >
                        {CONNECTION_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setNewConnectionChoicesTouched(true);
                          setNewConnectionChoices((prev) => ({
                            ...prev,
                            [key]: {
                              name: suggestion.name,
                              type: prev[key]?.type ?? type,
                              selected: !selected,
                            },
                          }));
                        }}
                        className={
                          selected
                            ? "bg-green/20 text-green-dark hover:bg-green/30 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            : "bg-cream-dark text-bark-light hover:bg-border-strong/40 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        }
                      >
                        {selected ? "✓ Added" : "＋ Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {MOMENT_TYPE_CHIPS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() =>
                  setSelectedType((prev) => (prev === label ? null : label))
                }
                className={
                  selectedType === label
                    ? "border-green/40 bg-green/15 text-green-dark rounded-full border px-3.5 py-1.5 text-xs font-semibold"
                    : "border-border-strong text-bark-light hover:bg-cream-dark rounded-full border px-3.5 py-1.5 text-xs"
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-muted text-xs">
              Write it as you&apos;d tell a colleague — tending does the filing.
            </p>
            <button
              type="button"
              onClick={handlePlantIt}
              disabled={!content.trim() || isSubmitting}
              className="from-green-dark to-moss-dark shrink-0 rounded-full bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(111,154,79,0.35)] transition-all hover:brightness-105 disabled:opacity-50"
            >
              {isSubmitting ? "Planting…" : "Plant it"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
