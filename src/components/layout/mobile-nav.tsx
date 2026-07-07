"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import {
  getNavItems,
  isNavItemActive,
  NavDotLink,
  type SidebarOrg,
} from "./sidebar";
import { OrgSwitcher } from "./org-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisations?: SidebarOrg[];
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

function MobileNav({
  open,
  onOpenChange,
  organisations = [],
  userName,
  userEmail,
  userImage,
}: MobileNavProps) {
  const pathname = usePathname();
  const orgSlug = pathname.split("/")[1] ?? "";
  const navItems = getNavItems(orgSlug);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-bark/40 backdrop-blur-sm md:hidden",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col bg-surface-sunken shadow-xl shadow-bark/10 md:hidden",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-left",
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left",
            "duration-300",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Navigation menu
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Main navigation links for the application
          </DialogPrimitive.Description>

          {/* Header */}
          <div className="flex h-12 items-center justify-end border-b border-border px-4">
            <DialogPrimitive.Close className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-bark transition-colors hover:bg-cream-dark">
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
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              <span className="sr-only">Close navigation</span>
            </DialogPrimitive.Close>
          </div>

          <OrgSwitcher organisations={organisations} currentSlug={orgSlug} />

          {/* Navigation links */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <NavDotLink
                key={item.href}
                item={item}
                isActive={isNavItemActive(pathname, item, orgSlug)}
                onClick={() => onOpenChange(false)}
              />
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-3">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface/70 focus:outline-none">
                  <Avatar className="h-8 w-8">
                    {userImage && (
                      <AvatarImage src={userImage} alt={userName ?? ""} />
                    )}
                    <AvatarFallback className="text-xs">
                      {userName
                        ? userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    {userName && (
                      <span className="truncate text-sm font-medium text-bark">
                        {userName}
                      </span>
                    )}
                    {userEmail && (
                      <span className="truncate text-xs text-muted">
                        {userEmail}
                      </span>
                    )}
                  </div>
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="start"
                  side="top"
                  sideOffset={8}
                  className="z-50 min-w-[200px] rounded-xl border border-border bg-surface p-1.5 shadow-hover"
                >
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { MobileNav };
export type { MobileNavProps };
