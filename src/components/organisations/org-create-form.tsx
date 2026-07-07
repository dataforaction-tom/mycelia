"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils/slugify";

export function OrgCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [withDemoData, setWithDemoData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewSlug = slugify(name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/organisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, withDemoData }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.push(`/${data.data.slug}`);
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
          Organisation name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="The Good Ship"
          required
          className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-bark placeholder:text-muted-light focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
        {previewSlug && (
          <p className="mt-1 text-xs text-muted">
            Your URL will be: tending.network/<strong>{previewSlug}</strong>
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-moss/20 bg-moss/5 p-3.5">
        <input
          type="checkbox"
          checked={withDemoData}
          onChange={(e) => setWithDemoData(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-moss"
        />
        <span className="text-sm text-bark">
          Start with example data so you can explore
          <span className="mt-0.5 block text-xs text-muted">
            A small living network to wander through — you can clear it in
            one click whenever you like.
          </span>
        </span>
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-terracotta px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create organisation"}
      </button>
    </form>
  );
}
