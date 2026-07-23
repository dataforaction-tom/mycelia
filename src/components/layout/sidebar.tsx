"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils/cn";
import { OrgSwitcher } from "./org-switcher";
import { SidebarWhisper } from "./sidebar-whisper";

interface NavItem {
  label: string;
  href: string;
}

function getNavItems(orgSlug: string): NavItem[] {
  return [
    { label: "Pulse", href: `/${orgSlug}` },
    { label: "Connections", href: `/${orgSlug}/connections` },
    { label: "Moments", href: `/${orgSlug}/moments` },
    { label: "Network", href: `/${orgSlug}/network` },
    { label: "Observations", href: `/${orgSlug}/observations` },
    { label: "Spaces", href: `/${orgSlug}/spaces` },
    { label: "Search", href: `/${orgSlug}/search` },
    { label: "Settings", href: `/${orgSlug}/settings` },
  ];
}

/**
 * Prototype nav item: a pill with a small dot instead of an icon. Active
 * items get a white pill, moss border and a glowing gradient dot.
 */
function NavDotLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all",
        isActive
          ? "border-moss/25 text-bark-dark bg-white font-semibold shadow-[0_4px_18px_rgba(138,154,86,0.14)]"
          : "text-bark-light border-transparent hover:bg-white/85"
      )}
    >
      <span
        className={cn(
          "inline-block h-2 w-2 shrink-0 rounded-full",
          isActive
            ? "from-terracotta to-moss bg-gradient-to-br shadow-[0_0_8px_rgba(138,154,86,0.5)]"
            : "bg-muted-light/50"
        )}
        aria-hidden="true"
      />
      {item.label}
    </Link>
  );
}

function isNavItemActive(pathname: string, item: NavItem, orgSlug: string) {
  // Pulse is the org root — exact match only, or every page would light it up.
  if (item.href === `/${orgSlug}`) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

interface SidebarOrg {
  id: string;
  name: string;
  slug: string;
  newConnectionSuggestions?: "opt_in" | "opt_out";
}

interface SidebarProps {
  organisations?: SidebarOrg[];
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

function Sidebar({ organisations = [], userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const orgSlug = pathname.split("/")[1] ?? "";
  const navItems = getNavItems(orgSlug);
  const currentOrg = organisations.find((o) => o.slug === orgSlug);

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <aside className="border-border fixed top-0 left-0 z-30 hidden h-screen w-[236px] flex-col border-r bg-white/60 px-[18px] py-[26px] backdrop-blur-xl md:flex">
      <OrgSwitcher organisations={organisations} currentSlug={orgSlug} />

      {/* Navigation */}
      <nav className="mt-7 flex flex-1 flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavDotLink
            key={item.href}
            item={item}
            isActive={isNavItemActive(pathname, item, orgSlug)}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3.5 pt-4">
        <SidebarWhisper organisationId={currentOrg?.id} />

        {/* User */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="focus-visible:ring-terracotta focus-visible:ring-offset-cream flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
              <span className="from-amber to-terracotta flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white">
                {initials}
              </span>
              <span className="text-bark-light truncate text-xs">
                {userName ?? userEmail ?? "Account"}
              </span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              side="top"
              sideOffset={8}
              className="border-border bg-surface shadow-hover z-50 min-w-[200px] rounded-xl border p-1.5"
            >
              {userEmail && (
                <div className="text-muted px-3 py-2 text-xs">{userEmail}</div>
              )}
              <DropdownMenu.Item asChild>
                <Link
                  href="/account"
                  className="text-bark hover:bg-cream-dark focus:bg-cream-dark block cursor-pointer rounded-md px-3 py-2 text-sm transition-colors outline-none"
                >
                  Account
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => signOut({ callbackUrl: "/" })}
                className="text-bark hover:bg-cream-dark focus:bg-cream-dark cursor-pointer rounded-md px-3 py-2 text-sm transition-colors outline-none"
              >
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </aside>
  );
}

export { Sidebar, getNavItems, NavDotLink, isNavItemActive };
export type { SidebarProps, SidebarOrg, NavItem };
