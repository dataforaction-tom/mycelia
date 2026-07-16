"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ConnectionFormProps {
  organisationId: string;
  orgSlug: string;
}

export function ConnectionForm({
  organisationId,
  orgSlug,
}: ConnectionFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("person");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organisation-id": organisationId,
        },
        body: JSON.stringify({ name, type }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.push(`/${orgSlug}/connections/${data.data.id}`);
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
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sarah from the community centre"
          required
          className="border-border text-bark placeholder:text-muted-light focus:border-terracotta focus:ring-terracotta mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-1 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="type" className="text-bark block text-sm font-medium">
          Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border-border text-bark focus:border-terracotta focus:ring-terracotta mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-1 focus:outline-none"
        >
          <option value="person">Person</option>
          <option value="organisation">Organisation</option>
          <option value="group">Group</option>
          <option value="community">Community</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-terracotta hover:bg-terracotta-dark w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Adding..." : "Add connection"}
      </button>
    </form>
  );
}
