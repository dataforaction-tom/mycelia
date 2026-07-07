// Drifting bioluminescent spores for dark soil panels — pure CSS animation
// (fadeDrift, defined in globals.css), deterministic positions/delays so
// server and client markup match. Gated on prefers-reduced-motion via the
// `animate-fade-drift` utility, which globals.css already zeroes out there.

interface SporesProps {
  count?: number;
  seed?: number;
  className?: string;
}

const SPORE_COLORS = [
  "var(--spore)",
  "var(--hypha)",
  "var(--node-tan)",
  "var(--node-clay)",
  "var(--node-ochre)",
];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Spores({ count = 5, seed = 7, className }: SporesProps) {
  const rand = mulberry32(seed);
  const spores = Array.from({ length: count }, (_, i) => {
    const size = 3 + Math.round(rand() * 2);
    const color = SPORE_COLORS[i % SPORE_COLORS.length];
    return {
      left: `${8 + rand() * 84}%`,
      top: `${55 + rand() * 38}%`,
      size,
      color,
      duration: 12 + rand() * 5,
      delay: rand() * 7,
    };
  });

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {spores.map((s, i) => (
        <span
          key={i}
          className="animate-fade-drift absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 ${s.size * 3}px ${Math.max(1, s.size - 1)}px ${s.color}`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export { Spores };
