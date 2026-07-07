"use client";

import { useEffect, useRef } from "react";
import type { RecognisedEntity } from "@/lib/moments/recognition";

interface EntityRecognitionOverlayProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Non-overlapping spans from matchEntities(), sorted by position. */
  entities: RecognisedEntity[];
  placeholder?: string;
}

interface Segment {
  text: string;
  kind: RecognisedEntity["kind"] | null;
}

function buildSegments(
  content: string,
  entities: RecognisedEntity[],
): Segment[] {
  const segments: Segment[] = [];
  let pos = 0;
  for (const entity of entities) {
    if (entity.start < pos || entity.end > content.length) continue;
    if (entity.start > pos) {
      segments.push({ text: content.slice(pos, entity.start), kind: null });
    }
    segments.push({
      text: content.slice(entity.start, entity.end),
      kind: entity.kind,
    });
    pos = entity.end;
  }
  if (pos < content.length) {
    segments.push({ text: content.slice(pos), kind: null });
  }
  return segments;
}

// Chip tints per prototype: people/connections in moss, spaces in ochre.
const CHIP_CLASSES: Record<NonNullable<Segment["kind"]>, string> = {
  connection: "rounded bg-moss/20 font-semibold text-moss-dark",
  space: "rounded bg-amber/20 font-semibold text-amber-dark",
};

// Both layers below must share font, size, line-height, padding and
// white-space handling exactly — the textarea's text is transparent (only
// its caret shows), so the overlay div is what the user actually sees, and
// it must line up character-for-character with the real input underneath.
const sharedTextStyle: React.CSSProperties = {
  fontFamily: "inherit",
  fontSize: "15px",
  lineHeight: 1.65,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

export function EntityRecognitionOverlay({
  value,
  onChange,
  onKeyDown,
  entities,
  placeholder,
}: EntityRecognitionOverlayProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  function syncScroll() {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  const segments = buildSegments(value, entities);

  return (
    <div className="relative min-h-[96px] rounded-2xl border border-border-strong bg-white">
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap px-4 py-3 text-bark"
        style={sharedTextStyle}
      >
        {value.length === 0 && placeholder && (
          <span className="text-muted-light">{placeholder}</span>
        )}
        {segments.map((seg, i) =>
          seg.kind ? (
            <span key={i} className={CHIP_CLASSES[seg.kind]}>
              {seg.text}
            </span>
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        onKeyDown={onKeyDown}
        rows={4}
        className="relative w-full resize-none bg-transparent px-4 py-3 text-transparent caret-bark outline-none"
        style={sharedTextStyle}
        autoFocus
      />
    </div>
  );
}
