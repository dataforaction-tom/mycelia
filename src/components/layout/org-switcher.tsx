"use client";

import * as React from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils/cn";

interface Org {
  id: string;
  name: string;
  slug: string;
}

interface OrgSwitcherProps {
  organisations: Org[];
  currentSlug: string;
}

/** The prototype's brand mark: a mushroom whose roots are hyphae threads. */
function MushroomMark({ className }: { className?: string }) {
  const gradientId = React.useId();
  return (
    <svg viewBox="0 0 40 44" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--terracotta)" />
          <stop offset="0.5" stopColor="var(--moss)" />
          <stop offset="1" stopColor="var(--green)" />
        </linearGradient>
      </defs>
      <path
        d="M6 17 C6 7, 34 7, 34 17 C34 20, 6 20, 6 17 Z"
        fill={`url(#${gradientId})`}
      />
      <path d="M17 20 L16 27 C16 29, 24 29, 24 27 L23 20 Z" fill="var(--spore)" />
      <g
        stroke="#b99e6b"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      >
        <path d="M20 29 C 20 33, 18 36, 19 42" />
        <path d="M20 31 C 16 34, 13 36, 10 41" />
        <path d="M13 37 C 11 38, 9 38, 7 39" />
        <path d="M20 31 C 24 34, 27 36, 30 41" />
        <path d="M27 37 C 29 38, 31 38, 33 39" />
        <path d="M19 36 C 17 39, 16 41, 15 43" />
      </g>
    </svg>
  );
}

/**
 * The brand block doubles as the organisation switcher: mushroom mark,
 * "tending" wordmark, and the current organisation as the uppercase kicker.
 */
export function OrgSwitcher({ organisations, currentSlug }: OrgSwitcherProps) {
  const current = organisations.find((o) => o.slug === currentSlug);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="group flex w-full items-center gap-2.5 rounded-xl px-2 py-1 text-left transition-colors hover:bg-white/70 focus:outline-none">
          <MushroomMark className="h-10 w-9 shrink-0 animate-breathe-soft" />
          <div className="min-w-0 flex-1">
            <div className="font-display text-[21px] leading-tight text-bark-dark">
              tending
            </div>
            <div className="truncate text-[10px] uppercase tracking-[0.14em] text-muted">
              {current?.name ?? "Choose organisation"}
            </div>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="z-50 min-w-[220px] rounded-xl border border-border bg-surface p-1.5 shadow-hover"
        >
          {organisations.map((org) => (
            <DropdownMenu.Item key={org.id} asChild>
              <Link
                href={`/${org.slug}`}
                className={cn(
                  "block cursor-pointer rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-cream-dark focus:bg-cream-dark",
                  org.slug === currentSlug
                    ? "font-medium text-terracotta"
                    : "text-bark"
                )}
              >
                {org.name}
              </Link>
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item asChild>
            <Link
              href="/new-org"
              className="block cursor-pointer rounded-md px-3 py-2 text-sm text-bark-light outline-none transition-colors hover:bg-cream-dark focus:bg-cream-dark"
            >
              + New organisation
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
