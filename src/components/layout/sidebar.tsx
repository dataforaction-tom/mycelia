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
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all",
        isActive
          ? "border-moss/25 bg-white font-semibold text-bark-dark shadow-[0_4px_18px_rgba(138,154,86,0.14)]"
          : "border-transparent text-bark-light hover:bg-white/85",
      )}
    >
      <span
        className={cn(
          "inline-block h-2 w-2 shrink-0 rounded-full",
          isActive
            ? "bg-gradient-to-br from-terracotta to-moss shadow-[0_0_8px_rgba(138,154,86,0.5)]"
            : "bg-muted-light/50",
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
}

interface SidebarProps {
  organisations?: SidebarOrg[];
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

function Sidebar({
  organisations = [],
  userName,
  userEmail,
}: SidebarProps) {
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
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[236px] flex-col border-r border-border bg-white/60 px-[18px] py-[26px] backdrop-blur-xl md:flex">
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
            <button className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white/70 focus:outline-none">
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber to-terracotta text-[11px] font-bold text-white">
                {initials}
              </span>
              <span className="truncate text-xs text-bark-light">
                {userName ?? userEmail ?? "Account"}
              </span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              side="top"
              sideOffset={8}
              className="z-50 min-w-[200px] rounded-xl border border-border bg-surface p-1.5 shadow-hover"
            >
              {userEmail && (
                <div className="px-3 py-2 text-xs text-muted">{userEmail}</div>
              )}
              <DropdownMenu.Item
                onSelect={() => signOut({ callbackUrl: "/" })}
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-bark outline-none transition-colors hover:bg-cream-dark focus:bg-cream-dark"
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
