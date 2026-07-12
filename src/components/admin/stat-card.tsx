interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

/**
 * The Pulse-dashboard stat tile, reused for admin metrics: uppercase tracked
 * label, big display value, optional muted hint.
 */
export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-[18px] border border-border bg-white/75 p-5 shadow-lift backdrop-blur transition-transform hover:-translate-y-0.5 hover:shadow-hover">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-bark">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
