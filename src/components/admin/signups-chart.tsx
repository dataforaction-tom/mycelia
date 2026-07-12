import type { SignupDay } from "@/lib/admin/metrics";

/**
 * Lightweight, dependency-free bar chart for daily sign-ups. Each bar carries
 * a native title tooltip; zero-days render as a faint baseline so the axis
 * reads continuously.
 */
export function SignupsChart({ data }: { data: SignupDay[] }) {
  const max = Math.max(1, ...data.map((day) => day.count));

  return (
    <div className="flex h-36 items-end gap-1">
      {data.map((day) => {
        const heightPct = day.count > 0 ? Math.max(6, (day.count / max) * 100) : 2;
        return (
          <div
            key={day.date}
            title={`${day.date}: ${day.count} sign-up${day.count === 1 ? "" : "s"}`}
            className="flex-1 rounded-t bg-gradient-to-t from-terracotta/70 to-moss/70 transition-colors hover:from-terracotta hover:to-moss"
            style={{ height: `${heightPct}%` }}
          />
        );
      })}
    </div>
  );
}
