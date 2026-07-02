"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";

interface DashboardShellProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

export function DashboardShell({
  children,
  userName,
  userEmail,
  userImage,
}: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
      />
      <div className="flex flex-1 flex-col md:pl-64">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <MobileNav
          open={mobileNavOpen}
          onOpenChange={setMobileNavOpen}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
