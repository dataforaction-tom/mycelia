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
      className="bg-terracotta shadow-lift hover:bg-terracotta-dark hover:shadow-hover rounded-lg px-4 py-2 text-sm font-medium text-white transition-all"
    >
      Add moment
    </button>
  );
}
