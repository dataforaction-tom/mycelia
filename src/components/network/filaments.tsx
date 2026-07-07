// Thin branching hyphae paths that grow up from the bottom edge of every
// dark soil panel. Deterministic (seeded, no Math.random/Date) so server-
// and client-rendered markup match exactly — this is pure decoration, safe
// to drop into server components as well as D3 canvases.

interface FilamentsProps {
  /** Viewbox width the paths are laid out against. */
  width?: number;
  /** Viewbox height — paths grow from y=height up towards y=0. */
  height?: number;
  /** How many branching filaments to draw across the width. */
  count?: number;
  /** Deterministic seed so repeated renders of the same panel look the same. */
  seed?: number;
  className?: string;
}

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

function buildFilamentPath(rand: () => number, x: number, height: number) {
  const jitter = (spread: number) => (rand() - 0.5) * spread;
  const y0 = height;
  const y1 = height * 0.55;
  const y2 = height * 0.28;
  const y3 = height * 0.04;
  const x1 = x + jitter(10);
  const x2 = x + jitter(14);
  const x3 = x + jitter(10);
  const branchX = x2 + 6 + jitter(6);
  const branchY = y2 - 4;

  return [
    `M${x} ${y0} C ${x1} ${y0 - (y0 - y1) * 0.35}, ${x1 - 6} ${y1 + (y0 - y1) * 0.2}, ${x2} ${y1}`,
    `M${x2} ${y1} C ${x2 - 5} ${y1 - (y1 - y2) * 0.3}, ${x2 + 6} ${y2 + (y1 - y2) * 0.25}, ${x3} ${y2}`,
    `M${x2} ${y1} C ${branchX - 4} ${branchY + 6}, ${branchX + 2} ${branchY - 2}, ${branchX + 8} ${branchY - 8}`,
    `M${x3} ${y2} C ${x3 - 4} ${y2 - (y2 - y3) * 0.4}, ${x3 + 5} ${y3 + (y2 - y3) * 0.2}, ${x3 + 2} ${y3}`,
  ].join(" ");
}

function Filaments({
  width = 460,
  height = 90,
  count = 6,
  seed = 1,
  className,
}: FilamentsProps) {
  const rand = mulberry32(seed);
  const step = width / (count + 1);
  const paths = Array.from({ length: count }, (_, i) =>
    buildFilamentPath(rand, step * (i + 1), height),
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height,
        opacity: 0.4,
        pointerEvents: "none",
      }}
    >
      <g
        stroke="var(--spore)"
        strokeWidth={1}
        fill="none"
        strokeLinecap="round"
      >
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

export { Filaments };
