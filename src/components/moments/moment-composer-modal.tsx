"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import type { MomentUnderstanding } from "@/lib/ai/moment-understanding";

interface MomentComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisationId: string;
  /** Pre-seed the text (e.g. a connection's name from its story page). */
  seedText?: string;
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

/** "1 person", "2 people and 1 space", "1 organisation, 1 space" … */
function describeRecognised(
  connections: RosterConnection[],
  spaceCount: number,
): string {
  const personCount = connections.filter((c) => c.type === "person").length;
  const orgCount = connections.length - personCount;
  const parts: string[] = [];
  if (personCount) parts.push(`${personCount} ${personCount === 1 ? "person" : "people"}`);
  if (orgCount) parts.push(`${orgCount} ${orgCount === 1 ? "organisation" : "organisations"}`);
  if (spaceCount) parts.push(`${spaceCount} ${spaceCount === 1 ? "space" : "spaces"}`);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}

export function MomentComposerModal({
  open,
  onOpenChange,
  organisationId,
  seedText,
}: MomentComposerModalProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [rosterConnections, setRosterConnections] = useState<RosterConnection[]>([]);
  const [rosterSpaces, setRosterSpaces] = useState<RosterSpace[]>([]);
  const [understanding, setUnderstanding] = useState<MomentUnderstanding | null>(null);
  const [usedVoice, setUsedVoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rosterLoadedFor = useRef<string | null>(null);

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
            (json.data.items as RosterConnection[]).map(({ id, name, type }) => ({ id, name, type })),
          );
        }
        if (spaceRes.ok) {
          const json = await spaceRes.json();
          setRosterSpaces(
            (json.data.items as RosterSpace[]).map(({ id, name }) => ({ id, name })),
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
    [rosterConnections, rosterSpaces],
  );

  // Instant, deterministic recognition on every keystroke.
  const matches = useMemo(() => matchEntities(content, roster), [content, roster]);
  const recognised = useMemo(() => distinctEntities(matches), [matches]);

  const connectionById = useMemo(
    () => new Map(rosterConnections.map((c) => [c.id, c])),
    [rosterConnections],
  );
  const recognisedConnectionIds = recognised
    .filter((e) => e.kind === "connection")
    .map((e) => e.id);
  const recognisedSpaceIds = recognised
    .filter((e) => e.kind === "space")
    .map((e) => e.id);

  // AI enhancement, best-effort and silent: catches mentions the literal
  // text search can't ("the food network" → Sheffield Food Network) and
  // detects event dates. Never blocks or breaks the composer.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!content.trim()) {
      setUnderstanding(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/moments/understand", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-organisation-id": organisationId,
          },
          body: JSON.stringify({ content }),
        });
        const data = await res.json();
        if (res.ok) setUnderstanding(data.data);
      } catch {
        // Recognition already happened locally; AI is a bonus.
      }
    }, UNDERSTAND_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, organisationId]);

  const aiExtraConnectionIds = (understanding?.entities ?? [])
    .map((e) => e.connectionId)
    .filter(
      (id): id is string =>
        Boolean(id) && !recognisedConnectionIds.includes(id!),
    );

  const allRecognisedConnections = [
    ...recognisedConnectionIds,
    ...aiExtraConnectionIds,
  ]
    .map((id) => connectionById.get(id))
    .filter((c): c is RosterConnection => Boolean(c));

  const recognisedSummary = describeRecognised(
    allRecognisedConnections,
    recognisedSpaceIds.length,
  );

  function resetAndClose() {
    setContent("");
    setUnderstanding(null);
    setSelectedType(null);
    setUsedVoice(false);
    setError(null);
    onOpenChange(false);
  }

  async function handlePlantIt() {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

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
          connectionIds: allRecognisedConnections.map((c) => c.id),
          spaceId:
            recognisedSpaceIds.length === 1 ? recognisedSpaceIds[0] : undefined,
          eventDate: understanding?.eventDate ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      resetAndClose();
      router.refresh();
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
      <DialogContent className="max-w-[640px] overflow-hidden rounded-3xl border-none bg-cream p-0 shadow-[0_40px_100px_rgba(27,19,10,0.5)] [&>button]:text-soil-ink-soft [&>button]:opacity-80 [&>button]:hover:opacity-100">
        <div className="underground relative h-[86px] overflow-hidden rounded-none border-none">
          <Filaments width={640} height={86} count={5} seed={3} />
          <Spores count={3} seed={3} />
          <DialogTitle className="absolute bottom-4 left-6 font-display text-2xl font-normal text-soil-ink">
            Plant a moment
          </DialogTitle>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
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
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="animate-glow h-[7px] w-[7px] shrink-0 rounded-full bg-moss" />
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
                    ? "rounded-full border border-green/40 bg-green/15 px-3.5 py-1.5 text-xs font-semibold text-green-dark"
                    : "rounded-full border border-border-strong px-3.5 py-1.5 text-xs text-bark-light hover:bg-cream-dark"
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-xs text-muted">
              Write it as you&apos;d tell a colleague — tending does the
              filing.
            </p>
            <button
              type="button"
              onClick={handlePlantIt}
              disabled={!content.trim() || isSubmitting}
              className="shrink-0 rounded-full bg-gradient-to-r from-green to-moss px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(111,154,79,0.35)] transition-all hover:brightness-105 disabled:opacity-50"
            >
              {isSubmitting ? "Planting…" : "Plant it"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
