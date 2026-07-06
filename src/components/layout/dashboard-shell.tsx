"use client";

import { useState } from "react";
import { Sidebar, type SidebarOrg } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";

interface DashboardShellProps {
  children: React.ReactNode;
  organisations?: SidebarOrg[];
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

export function DashboardShell({
  children,
  organisations,
  userName,
  userEmail,
  userImage,
}: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar
        organisations={organisations}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
      />
      <div className="flex flex-1 flex-col md:pl-64">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <MobileNav
          open={mobileNavOpen}
          onOpenChange={setMobileNavOpen}
          organisations={organisations}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
        />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
