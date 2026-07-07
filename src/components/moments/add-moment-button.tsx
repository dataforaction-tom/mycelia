"use client";

import { useMomentComposer } from "./moment-composer-context";

/**
 * Opens the "Plant a moment" composer, seeded with a name so recognition
 * links the moment to that connection immediately.
 */
export function AddMomentButton({ seedText }: { seedText?: string }) {
  const { openComposer } = useMomentComposer();

  return (
    <button
      type="button"
      onClick={() => openComposer({ seedText })}
      className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white shadow-lift transition-all hover:bg-terracotta-dark hover:shadow-hover"
    >
      Add moment
    </button>
  );
}
