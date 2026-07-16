"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface Connection {
  id: string;
  name: string;
  type: string;
}

interface ConnectionPickerProps {
  connections: Connection[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const typeColors: Record<string, string> = {
  person: "bg-sky/10 text-sky-dark",
  organisation: "bg-terracotta/10 text-terracotta-dark",
  group: "bg-moss/10 text-moss-dark",
  community: "bg-amber/10 text-amber-dark",
};

export function ConnectionPicker({
  connections,
  selected,
  onChange,
}: ConnectionPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = connections.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) &&
      !selected.includes(c.id)
  );

  const selectedConnections = connections.filter((c) =>
    selected.includes(c.id)
  );

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="space-y-3">
      {/* Selected badges */}
      {selectedConnections.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedConnections.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className="border-border text-bark hover:bg-cream-dark inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-xs font-medium transition-colors"
            >
              {c.name}
              <svg
                className="text-muted h-3 w-3"
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

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search connections to link"
        placeholder="Search connections to link..."
        className="border-border text-bark placeholder:text-muted-light focus:border-terracotta focus:ring-terracotta block w-full rounded-lg border bg-white px-3 py-2 text-sm focus:ring-1 focus:outline-none"
      />

      {/* Options */}
      {search && filtered.length > 0 && (
        <div className="border-border max-h-48 overflow-y-auto rounded-lg border bg-white">
          {filtered.slice(0, 10).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                toggle(c.id);
                setSearch("");
              }}
              className="text-bark hover:bg-cream flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors"
            >
              <span>{c.name}</span>
              <Badge className={typeColors[c.type] ?? ""}>{c.type}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
