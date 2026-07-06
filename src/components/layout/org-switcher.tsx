"use client";

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

export function OrgSwitcher({ organisations, currentSlug }: OrgSwitcherProps) {
  const current = organisations.find((o) => o.slug === currentSlug);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex h-16 w-full items-center gap-2.5 border-b border-border px-5 text-left transition-colors hover:bg-surface/70 focus:outline-none">
          {/* Hyphae mark: threads branching upward from a shared root */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-terracotta to-amber text-white shadow-lift">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
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
          <span className="flex-1 truncate text-base font-semibold text-bark">
            {current?.name ?? "Mycelium"}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-muted"
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
