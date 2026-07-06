"use client";

interface Option {
  value: string;
  label: string;
}

interface MomentFiltersProps {
  spaces: Option[];
  authors: Option[];
  spaceId?: string;
  authorId?: string;
  connectionType?: string;
  from?: string;
  to?: string;
}

const CONNECTION_TYPE_OPTIONS: Option[] = [
  { value: "person", label: "Person" },
  { value: "organisation", label: "Organisation" },
  { value: "group", label: "Group" },
  { value: "community", label: "Community" },
];

export function MomentFilters({
  spaces,
  authors,
  spaceId,
  authorId,
  connectionType,
  from,
  to,
}: MomentFiltersProps) {
  return (
    <form
      method="GET"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white p-3 text-sm"
      onChange={(e) => e.currentTarget.requestSubmit()}
    >
      {spaces.length > 0 && (
        <label className="flex items-center gap-1.5 text-muted">
          Space
          <select
            name="spaceId"
            defaultValue={spaceId ?? ""}
            className="rounded-lg border border-border bg-white px-2 py-1 text-sm text-bark focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
          >
            <option value="">All</option>
            {spaces.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {authors.length > 0 && (
        <label className="flex items-center gap-1.5 text-muted">
          Author
          <select
            name="authorId"
            defaultValue={authorId ?? ""}
            className="rounded-lg border border-border bg-white px-2 py-1 text-sm text-bark focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
          >
            <option value="">All</option>
            {authors.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex items-center gap-1.5 text-muted">
        Connection type
        <select
          name="connectionType"
          defaultValue={connectionType ?? ""}
          className="rounded-lg border border-border bg-white px-2 py-1 text-sm text-bark focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        >
          <option value="">All</option>
          {CONNECTION_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1.5 text-muted">
        From
        <input
          type="date"
          name="from"
          defaultValue={from ?? ""}
          className="rounded-lg border border-border bg-white px-2 py-1 text-sm text-bark focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </label>

      <label className="flex items-center gap-1.5 text-muted">
        To
        <input
          type="date"
          name="to"
          defaultValue={to ?? ""}
          className="rounded-lg border border-border bg-white px-2 py-1 text-sm text-bark focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </label>
    </form>
  );
}
