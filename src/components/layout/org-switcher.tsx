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
        <button className="flex h-16 w-full items-center gap-2 border-b border-border px-6 text-left transition-colors hover:bg-cream-dark focus:outline-none">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-terracotta text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
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
          className="z-50 min-w-[220px] rounded-lg border border-border bg-white p-1.5 shadow-md"
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
