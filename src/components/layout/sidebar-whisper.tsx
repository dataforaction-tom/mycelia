"use client";

import { useEffect, useState } from "react";

/**
 * The sidebar's bottom whisper: one soft sentence about how the network
 * moved this week, from real connection data. Hidden entirely until the
 * count is known (and if the fetch fails) — never a placeholder.
 */
export function SidebarWhisper({
  organisationId,
}: {
  organisationId?: string;
}) {
  const [newThreads, setNewThreads] = useState<number | null>(null);

  useEffect(() => {
    if (!organisationId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          "/api/connections?sort=created_at&order=desc&limit=100",
          { headers: { "x-organisation-id": organisationId } },
        );
        if (!res.ok) return;
        const json = await res.json();
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const count = (json.data.items as { createdAt: string }[]).filter(
          (c) => new Date(c.createdAt).getTime() >= oneWeekAgo,
        ).length;
        if (!cancelled) setNewThreads(count);
      } catch {
        // No card is better than a wrong card.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organisationId]);

  if (newThreads === null) return null;

  return (
    <div className="rounded-[14px] border border-moss/15 bg-gradient-to-r from-terracotta/10 to-moss/10 p-3.5 text-xs leading-relaxed text-bark-light">
      <span className="text-terracotta">❋</span>{" "}
      {newThreads > 0
        ? `The network grew ${newThreads} new ${newThreads === 1 ? "thread" : "threads"} this week.`
        : "The network is holding steady this week."}
    </div>
  );
}
