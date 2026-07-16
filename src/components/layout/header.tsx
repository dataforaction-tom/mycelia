"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface HeaderProps {
  orgName?: string;
  onMenuClick?: () => void;
}

function Header({ orgName = "tending", onMenuClick }: HeaderProps) {
  return (
    <header
      className={cn(
        "border-border bg-cream sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4",
        "md:hidden"
      )}
    >
      <button
        type="button"
        onClick={onMenuClick}
        className="text-bark hover:bg-cream-dark inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
        aria-label="Open navigation menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <div className="from-terracotta to-amber flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 21v-7" />
            <path d="M12 14c0-4-5-3.5-6-8" />
            <path d="M12 14c0-4 5-3.5 6-8" />
            <path d="M12 14V5" />
            <circle cx="6" cy="4" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="18" cy="4" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="12" cy="3" r="1.4" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <span className="font-display text-bark text-base font-semibold">
          {orgName}
        </span>
      </div>
    </header>
  );
}

export { Header };
export type { HeaderProps };
