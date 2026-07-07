import type { ReactElement } from "react";

// A small fixed set of hand-drawn icons for Spaces cards, in the spirit of
// the design handoff's sprout/triad/mushroom motifs. Picked deterministically
// per space (hash of id) so the same space always renders the same icon
// without a dedicated icon column on the table.

function SproutIcon() {
  return (
    <>
      <circle cx="22" cy="22" r="21" fill="rgba(111,154,79,.12)" />
      <g stroke="var(--green-dark)" strokeWidth={1.4} fill="none" strokeLinecap="round">
        <path d="M22 34 C 22 26, 20 20, 22 12" />
        <path d="M22 22 C 17 19, 14 15, 13 10" />
        <path d="M22 22 C 27 19, 30 15, 31 10" />
        <path d="M22 28 C 18 27, 15 24, 14 21" />
        <path d="M22 28 C 26 27, 29 24, 30 21" />
      </g>
    </>
  );
}

function TriadIcon() {
  return (
    <>
      <circle cx="22" cy="22" r="21" fill="rgba(138,154,86,.1)" />
      <g fill="var(--moss-dark)">
        <circle cx="22" cy="14" r="3.4" />
        <circle cx="13" cy="27" r="3.4" />
        <circle cx="31" cy="27" r="3.4" />
      </g>
      <g stroke="var(--moss-dark)" strokeWidth={1.2} fill="none" strokeOpacity={0.5}>
        <path d="M22 14 L13 27 L31 27 Z" />
      </g>
    </>
  );
}

function MushroomIcon() {
  return (
    <>
      <circle cx="22" cy="22" r="21" fill="rgba(201,150,46,.14)" />
      <path
        d="M12 20 C12 13, 32 13, 32 20 C32 22, 12 22, 12 20 Z"
        fill="var(--amber)"
      />
      <path
        d="M19 22 L18.4 28 C18.4 29.5, 25.6 29.5, 25.6 28 L25 22 Z"
        fill="var(--spore)"
      />
      <g stroke="var(--amber-dark)" strokeWidth={1.1} fill="none" strokeLinecap="round">
        <path d="M22 30 C 22 33, 21 35, 21.5 38" />
        <path d="M22 31 C 19 33, 17 35, 15 37" />
        <path d="M22 31 C 25 33, 27 35, 29 37" />
      </g>
    </>
  );
}

const SPACE_ICONS: (() => ReactElement)[] = [SproutIcon, TriadIcon, MushroomIcon];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Deterministically pick one of the fixed space icons for a given id/name. */
export function SpaceIcon({ seed }: { seed: string }) {
  const Icon = SPACE_ICONS[hashString(seed) % SPACE_ICONS.length];
  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11" aria-hidden="true">
      <Icon />
    </svg>
  );
}
