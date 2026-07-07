"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SpaceIcon } from "@/lib/config/space-icons";

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
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => (
          <div
            key={space.id}
            className="rounded-xl border border-border bg-surface p-5 shadow-lift"
          >
            <SpaceIcon seed={space.id} />
            <p className="mt-3 font-medium text-bark">{space.name}</p>
            {space.description && (
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {space.description}
              </p>
            )}
            <div className="mt-4 flex shrink-0 items-center gap-3">
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
    </div>
  );
}
