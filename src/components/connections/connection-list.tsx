"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectionCard } from "./connection-card";

interface Connection {
  id: string;
  name: string;
  type: "person" | "organisation" | "group" | "community";
  createdAt: Date;
  updatedAt: Date;
  momentCount: number;
  lastMomentDate: Date | null;
}

interface ConnectionListProps {
  connections: Connection[];
  orgSlug: string;
}

export function ConnectionList({ connections, orgSlug }: ConnectionListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const filtered = connections.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (typeFilter && c.type !== typeFilter) return false;
    return true;
  });

  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10">
          <svg
            className="h-6 w-6 text-terracotta"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-bark">
          No connections yet
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Every relationship starts somewhere. Add your first connection to
          begin mapping your relational ecosystem.
        </p>
        <Link
          href={`/${orgSlug}/connections/new`}
          className="mt-6 rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark"
        >
          Add your first connection
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search connections..."
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-bark placeholder:text-muted-light focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-bark focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        >
          <option value="">All types</option>
          <option value="person">Person</option>
          <option value="organisation">Organisation</option>
          <option value="group">Group</option>
          <option value="community">Community</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            orgSlug={orgSlug}
          />
        ))}
      </div>

      {filtered.length === 0 && connections.length > 0 && (
        <p className="text-center text-sm text-muted">
          No connections match your search.
        </p>
      )}
    </div>
  );
}
