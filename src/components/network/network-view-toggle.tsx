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
      <div className="inline-flex rounded-full border border-border bg-surface p-1 shadow-lift">
        <button
          type="button"
          onClick={() => setView("force")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            view === "force"
              ? "bg-bark text-cream shadow-sm"
              : "text-bark-light hover:bg-cream-dark"
          }`}
        >
          Threads
        </button>
        <button
          type="button"
          onClick={() => setView("constellation")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            view === "constellation"
              ? "bg-bark text-cream shadow-sm"
              : "text-bark-light hover:bg-cream-dark"
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
