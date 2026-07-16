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
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
        >
          {error}
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
          placeholder="The Good Ship"
          required
          className="border-border text-bark placeholder:text-muted-light focus:border-terracotta focus:ring-terracotta mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-1 focus:outline-none"
        />
        {previewSlug && (
          <p className="text-muted mt-1 text-xs">
            Your URL will be: tending.network/<strong>{previewSlug}</strong>
          </p>
        )}
      </div>

      <label className="border-moss/20 bg-moss/5 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5">
        <input
          type="checkbox"
          checked={withDemoData}
          onChange={(e) => setWithDemoData(e.target.checked)}
          className="border-border accent-moss mt-0.5 h-4 w-4 shrink-0 rounded"
        />
        <span className="text-bark text-sm">
          Start with example data so you can explore
          <span className="text-muted mt-0.5 block text-xs">
            A small living network to wander through — you can clear it in one
            click whenever you like.
          </span>
        </span>
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-terracotta hover:bg-terracotta-dark w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create organisation"}
      </button>
    </form>
  );
}
