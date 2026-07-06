"use client";

import { useState } from "react";

interface Space {
  id: string;
  name: string;
}

interface SpacePickerProps {
  connectionId: string;
  organisationId: string;
  allSpaces: Space[];
  initialSelected: string[];
}

export function SpacePicker({
  connectionId,
  organisationId,
  allSpaces,
  initialSelected,
}: SpacePickerProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = allSpaces.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      !selected.includes(s.id)
  );

  const selectedSpaces = allSpaces.filter((s) => selected.includes(s.id));

  async function persist(spaceId: string, method: "POST" | "DELETE") {
    setError(null);
    try {
      const res = await fetch(
        `/api/connections/${connectionId}/spaces`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            "x-organisation-id": organisationId,
          },
          body: JSON.stringify({ spaceIds: [spaceId] }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      setSelected((prev) =>
        method === "POST"
          ? [...prev, spaceId]
          : prev.filter((id) => id !== spaceId)
      );
    } catch {
      setError("Something went wrong");
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {selectedSpaces.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSpaces.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => persist(s.id, "DELETE")}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-bark transition-colors hover:bg-cream-dark"
            >
              {s.name}
              <svg
                className="h-3 w-3 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Add to a space…"
        className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-bark placeholder:text-muted-light focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
      />

      {search && filtered.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-white">
          {filtered.slice(0, 10).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                persist(s.id, "POST");
                setSearch("");
              }}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-bark transition-colors hover:bg-cream"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
