"use client";

import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const user = session.user;
  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta text-sm font-medium text-white transition-colors hover:bg-terracotta-dark focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-cream">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "User avatar"}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[200px] rounded-lg border border-border bg-white p-1.5 shadow-md"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-bark">
              {user.name ?? "User"}
            </p>
            <p className="text-xs text-muted">{user.email}</p>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            onSelect={() => signOut({ callbackUrl: "/" })}
            className="cursor-pointer rounded-md px-3 py-2 text-sm text-bark outline-none transition-colors hover:bg-cream-dark focus:bg-cream-dark"
          >
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
