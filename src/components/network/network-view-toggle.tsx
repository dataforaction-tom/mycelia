"use client";

import { useState } from "react";
import { NetworkGraph } from "./network-graph";
import { ConstellationView } from "./constellation-view";

export function NetworkViewToggle({
  organisationId,
  orgSlug,
}: {
  organisationId: string;
  orgSlug: string;
}) {
  const [view, setView] = useState<"force" | "constellation">("force");

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-full border border-soil-line p-1">
        <button
          type="button"
          onClick={() => setView("force")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            view === "force"
              ? "bg-spore/15 text-soil-ink"
              : "text-soil-ink-soft hover:text-soil-ink"
          }`}
        >
          Threads
        </button>
        <button
          type="button"
          onClick={() => setView("constellation")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            view === "constellation"
              ? "bg-spore/15 text-soil-ink"
              : "text-soil-ink-soft hover:text-soil-ink"
          }`}
        >
          Constellations
        </button>
      </div>

      {view === "force" ? (
        <NetworkGraph organisationId={organisationId} orgSlug={orgSlug} />
      ) : (
        <ConstellationView organisationId={organisationId} orgSlug={orgSlug} />
      )}
    </div>
  );
}
