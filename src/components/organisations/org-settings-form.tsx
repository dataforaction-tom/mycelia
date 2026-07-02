"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Organisation {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

export function OrgSettingsForm({ org }: { org: Organisation }) {
  const router = useRouter();
  const [name, setName] = useState(org.name);
  const [slug, setSlug] = useState(org.slug);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/organisations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setSuccess(true);

      // If slug changed, redirect to new URL
      if (slug !== org.slug) {
        router.push(`/${slug}/settings`);
      } else {
        router.refresh();
      }
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

      {success && (
        <div className="rounded-lg border border-moss/30 bg-moss/10 p-3 text-sm text-moss-dark">
          Settings updated successfully.
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-bark">
          Organisation name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-bark focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-bark">
          URL slug
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
          className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-bark focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
        <p className="mt-1 text-xs text-muted">
          Lowercase letters, numbers, and dashes only
        </p>
      </div>

      <div className="rounded-lg border border-border bg-cream-dark p-4">
        <p className="text-sm text-muted">
          <strong className="text-bark">Plan:</strong>{" "}
          <span className="capitalize">{org.plan}</span>
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-terracotta px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
