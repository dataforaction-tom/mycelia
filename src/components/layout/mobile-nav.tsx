"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils/cn";
import { getNavItems } from "./sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgName?: string;
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

function MobileNav({
  open,
  onOpenChange,
  orgName = "Mycelium",
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
            "fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col bg-cream shadow-xl shadow-bark/10 md:hidden",
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
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-terracotta text-white">
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
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-bark">{orgName}</span>
            </div>
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

          {/* Navigation links */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-terracotta/10 text-terracotta"
                      : "text-bark-light hover:bg-cream-dark hover:text-bark",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0",
                      isActive ? "text-terracotta" : "text-muted",
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
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
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { MobileNav };
export type { MobileNavProps };
