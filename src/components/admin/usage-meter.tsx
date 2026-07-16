import { cn } from "@/lib/utils/cn";

interface UsageMeterProps {
  used: number;
  limit: number;
}

/**
 * A compact used/limit meter. Colours escalate as usage approaches the cap:
 * moss (healthy) → amber (≥75%) → destructive (over). Infinite limits show
 * the count with no bar.
 */
export function UsageMeter({ used, limit }: UsageMeterProps) {
  if (!Number.isFinite(limit)) {
    return (
      <span className="text-muted font-mono text-xs">
        {used} <span className="text-muted/60">/ ∞</span>
      </span>
    );
  }

  const ratio = limit > 0 ? used / limit : 0;
  const pct = Math.min(100, Math.round(ratio * 100));
  const tone =
    ratio > 1 ? "bg-destructive" : ratio >= 0.75 ? "bg-amber" : "bg-moss";

  return (
    <div className="min-w-[92px]">
      <div className="text-muted mb-1 font-mono text-xs">
        {used} <span className="text-muted/60">/ {limit}</span>
      </div>
      <div className="bg-cream-dark h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full", tone)}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  );
}
