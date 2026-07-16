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
      <div className="border-border rounded-xl border border-dashed bg-white p-8 text-center">
        <p className="text-muted text-sm">
          No spaces yet. Spaces group connections and moments around a project,
          idea, or theme.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => (
          <div
            key={space.id}
            className="border-border bg-surface shadow-lift rounded-xl border p-5"
          >
            <SpaceIcon seed={space.id} />
            <p className="text-bark mt-3 font-medium">{space.name}</p>
            {space.description && (
              <p className="text-muted mt-1 text-sm leading-relaxed">
                {space.description}
              </p>
            )}
            <div className="mt-4 flex shrink-0 items-center gap-3">
              <Link
                href={`/${orgSlug}/settings/spaces/${space.id}/edit`}
                className="text-terracotta hover:text-terracotta-dark text-sm"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(space.id)}
                disabled={deletingId === space.id}
                className="text-destructive text-sm hover:opacity-80 disabled:opacity-50"
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
