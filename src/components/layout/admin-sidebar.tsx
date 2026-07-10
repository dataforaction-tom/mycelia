"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils/cn";
import { NavDotLink, type NavItem } from "./sidebar";

const ADMIN_NAV: NavItem[] = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Organisations", href: "/admin/organisations" },
  { label: "Usage", href: "/admin/usage" },
  { label: "Feedback", href: "/admin/feedback" },
];

function isAdminNavActive(pathname: string, href: string) {
  // Overview is the admin root — exact match only.
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

interface AdminSidebarProps {
  userName?: string;
  userEmail?: string;
}

export function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();

  const initials = userName
    ? userName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[236px] flex-col border-r border-border bg-white/60 px-[18px] py-[26px] backdrop-blur-xl md:flex">
        <Link href="/admin" className="flex items-center gap-2 px-1">
          <span className="font-display text-[21px] text-bark-dark">tending</span>
          <span className="rounded-full bg-bark px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Admin
          </span>
        </Link>

        <nav className="mt-7 flex flex-1 flex-col gap-1 overflow-y-auto">
          {ADMIN_NAV.map((item) => (
            <NavDotLink
              key={item.href}
              item={item}
              isActive={isAdminNavActive(pathname, item.href)}
            />
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1.5 pt-4">
          <Link
            href="/"
            className="rounded-xl border border-transparent px-3 py-2.5 text-sm text-bark-light transition-colors hover:bg-white/85"
          >
            ← Back to app
          </Link>

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

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 overflow-x-auto border-b border-border bg-white/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link href="/admin" className="flex shrink-0 items-center gap-1.5">
          <span className="font-display text-lg text-bark-dark">tending</span>
          <span className="rounded-full bg-bark px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">
            Admin
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors",
                isAdminNavActive(pathname, item.href)
                  ? "bg-bark text-white"
                  : "text-bark-light hover:bg-cream-dark",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
