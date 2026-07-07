import Link from "next/link";

interface WhisperConnection {
  id: string;
  name: string;
}

interface WhisperCardProps {
  type: string;
  content: string;
  connections: WhisperConnection[];
  orgSlug: string;
}

// Prototype voice: each observation type whispers under its own kicker.
const KICKERS: Record<string, { label: string; accent: string; card: string }> = {
  dormant: {
    label: "Going quiet",
    accent: "text-terracotta-dark",
    card: "border-terracotta/30 bg-gradient-to-r from-terracotta/10 to-white/85",
  },
  quality_shift: {
    label: "Shifting",
    accent: "text-moss",
    card: "border-border bg-white/80",
  },
  dependency: {
    label: "A gap you might not see",
    accent: "text-terracotta-dark",
    card: "border-border bg-white/80",
  },
};

const FALLBACK_KICKER = {
  label: "Noticed",
  accent: "text-moss",
  card: "border-border bg-white/80",
};

/**
 * A whisper: the dashboard's compact, action-free rendering of an
 * observation. Acting on it happens on the Observations page.
 */
export function WhisperCard({
  type,
  content,
  connections,
  orgSlug,
}: WhisperCardProps) {
  const kicker = KICKERS[type] ?? FALLBACK_KICKER;

  return (
    // The whole card clicks through to Observations via an overlay link;
    // the connection links sit above it, so both stay reachable without
    // nesting anchors.
    <div
      className={`relative rounded-2xl border p-4 transition-shadow hover:shadow-lift ${kicker.card}`}
    >
      <Link
        href={`/${orgSlug}/observations`}
        aria-label="View all observations"
        className="absolute inset-0 rounded-2xl"
      />
      <p
        className={`text-[11px] font-medium uppercase tracking-[0.1em] ${kicker.accent}`}
      >
        {kicker.label}
      </p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-bark">
        {content}
      </p>
      {connections.length > 0 && (
        <p className="relative mt-2 text-xs">
          {connections.map((c, i) => (
            <span key={c.id}>
              <Link
                href={`/${orgSlug}/connections/${c.id}`}
                className="text-terracotta-dark underline decoration-terracotta/40 decoration-dotted underline-offset-2 hover:decoration-terracotta"
              >
                {c.name}
              </Link>
              {i < connections.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
