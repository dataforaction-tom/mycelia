"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Space {
  id: string;
  name: string;
  description: string | null;
}

interface SpaceListProps {
  spaces: Space[];
  organisationId: string;
  orgSlug: string;
}

export function SpaceList({ spaces, organisationId, orgSlug }: SpaceListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/spaces/${id}`, {
        method: "DELETE",
        headers: { "x-organisation-id": organisationId },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  }

  if (spaces.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
        <p className="text-sm text-muted">
          No spaces yet. Spaces group connections and moments around a
          project, idea, or theme.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {spaces.map((space) => (
        <div
          key={space.id}
          className="flex items-center justify-between rounded-lg border border-border bg-white p-4"
        >
          <div>
            <p className="font-medium text-bark">{space.name}</p>
            {space.description && (
              <p className="mt-1 text-sm text-muted">{space.description}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={`/${orgSlug}/settings/spaces/${space.id}/edit`}
              className="text-sm text-terracotta hover:text-terracotta-dark"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(space.id)}
              disabled={deletingId === space.id}
              className="text-sm text-destructive hover:opacity-80 disabled:opacity-50"
            >
              {deletingId === space.id ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
