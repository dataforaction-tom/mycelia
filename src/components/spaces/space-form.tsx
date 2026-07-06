"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Space {
  id: string;
  name: string;
  description: string | null;
}

interface SpaceFormProps {
  organisationId: string;
  orgSlug: string;
  space?: Space;
}

export function SpaceForm({ organisationId, orgSlug, space }: SpaceFormProps) {
  const router = useRouter();
  const [name, setName] = useState(space?.name ?? "");
  const [description, setDescription] = useState(space?.description ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const url = space ? `/api/spaces/${space.id}` : "/api/spaces";
      const res = await fetch(url, {
        method: space ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organisation-id": organisationId,
        },
        body: JSON.stringify({ name, description: description || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.push(`/${orgSlug}/settings/spaces`);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-bark">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Winter Programme"
          required
          className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-bark placeholder:text-muted-light focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-bark"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What is this space for?"
          className="mt-1 block w-full resize-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-bark placeholder:text-muted-light focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-terracotta px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : space ? "Save changes" : "Create space"}
      </button>
    </form>
  );
}
