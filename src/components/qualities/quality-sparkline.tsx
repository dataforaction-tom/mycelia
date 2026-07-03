const WIDTH = 80;
const HEIGHT = 24;

interface QualitySparklineProps {
  points: { position: number }[];
}

export function QualitySparkline({ points }: QualitySparklineProps) {
  if (points.length < 2) return null;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * WIDTH;
    const y = ((1 - p.position) / 2) * HEIGHT;
    return `${x},${y}`;
  });

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="shrink-0"
    >
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="#6b8f5e"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
