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
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          aria-live="polite"
          className="border-moss/30 bg-moss/10 text-moss-dark rounded-lg border p-3 text-sm"
        >
          Settings updated successfully.
        </div>
      )}

      <div>
        <label htmlFor="name" className="text-bark block text-sm font-medium">
          Organisation name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border-border text-bark focus:border-terracotta focus:ring-terracotta mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-1 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="slug" className="text-bark block text-sm font-medium">
          URL slug
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
          className="border-border text-bark focus:border-terracotta focus:ring-terracotta mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-1 focus:outline-none"
        />
        <p className="text-muted mt-1 text-xs">
          Lowercase letters, numbers, and dashes only
        </p>
      </div>

      <div className="border-border bg-cream-dark rounded-lg border p-4">
        <p className="text-muted text-sm">
          <strong className="text-bark">Plan:</strong>{" "}
          <span className="capitalize">{org.plan}</span>
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-terracotta hover:bg-terracotta-dark rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
