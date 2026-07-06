"use client";

import { CONNECTION_TYPE_COLORS, type ConnectionType } from "@/lib/config/theme";

const TYPE_OPTIONS: ConnectionType[] = [
  "person",
  "organisation",
  "group",
  "community",
];

interface NetworkControlsProps {
  activeTypes: Set<ConnectionType>;
  onToggleType: (type: ConnectionType) => void;
  minStrength: number;
  onMinStrengthChange: (value: number) => void;
  hideUnconnected: boolean;
  onHideUnconnectedChange: (value: boolean) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function NetworkControls({
  activeTypes,
  onToggleType,
  minStrength,
  onMinStrengthChange,
  hideUnconnected,
  onHideUnconnectedChange,
  searchTerm,
  onSearchChange,
}: NetworkControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4 text-sm shadow-lift">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Find someone…"
        className="w-48 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-bark placeholder:text-muted-light focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
      />

      <div className="flex items-center gap-3">
        {TYPE_OPTIONS.map((type) => (
          <label
            key={type}
            className="flex cursor-pointer items-center gap-1.5 capitalize text-bark-light"
          >
            <input
              type="checkbox"
              checked={activeTypes.has(type)}
              onChange={() => onToggleType(type)}
              className="h-3.5 w-3.5 rounded border-border"
              style={{ accentColor: CONNECTION_TYPE_COLORS[type] }}
            />
            {type}
          </label>
        ))}
      </div>

      <label className="flex items-center gap-2 text-bark-light">
        Min strength
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={minStrength}
          onChange={(e) => onMinStrengthChange(Number(e.target.value))}
          className="w-24"
        />
        <span className="w-8 text-xs text-muted">{minStrength.toFixed(1)}</span>
      </label>

      <label className="flex cursor-pointer items-center gap-1.5 text-bark-light">
        <input
          type="checkbox"
          checked={hideUnconnected}
          onChange={(e) => onHideUnconnectedChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-border"
        />
        Hide unconnected
      </label>
    </div>
  );
}
