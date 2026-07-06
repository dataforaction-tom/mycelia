"use client";

interface SpaceFilterSelectProps {
  spaces: { id: string; name: string }[];
  selected?: string;
}

export function SpaceFilterSelect({ spaces, selected }: SpaceFilterSelectProps) {
  return (
    <form method="GET" className="flex items-center gap-2">
      <label htmlFor="spaceId" className="text-sm text-muted">
        Space
      </label>
      <select
        id="spaceId"
        name="spaceId"
        defaultValue={selected ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-bark focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
      >
        <option value="">All spaces</option>
        {spaces.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </form>
  );
}
