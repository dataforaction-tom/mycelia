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
      <div className="inline-flex rounded-lg border border-border bg-white p-1">
        <button
          type="button"
          onClick={() => setView("force")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "force"
              ? "bg-terracotta text-white"
              : "text-bark-light hover:bg-cream-dark"
          }`}
        >
          Force-directed
        </button>
        <button
          type="button"
          onClick={() => setView("constellation")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "constellation"
              ? "bg-terracotta text-white"
              : "text-bark-light hover:bg-cream-dark"
          }`}
        >
          Constellation
        </button>
      </div>

      {view === "force" ? (
        <NetworkGraph organisationId={organisationId} orgSlug={orgSlug} />
      ) : (
        <ConstellationView organisationId={organisationId} />
      )}
    </div>
  );
}
