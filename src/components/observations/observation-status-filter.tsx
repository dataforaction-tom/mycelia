"use client";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "seen", label: "Seen" },
  { value: "acted_on", label: "Acted on" },
  { value: "dismissed", label: "Dismissed" },
];

export function ObservationStatusFilter({ selected }: { selected?: string }) {
  return (
    <form method="GET" className="flex items-center gap-2">
      <label htmlFor="status" className="text-sm text-muted">
        Status
      </label>
      <select
        id="status"
        name="status"
        defaultValue={selected ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-bark focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </form>
  );
}
