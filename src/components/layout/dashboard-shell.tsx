"use client";

import { useState } from "react";
import { Sidebar, type SidebarOrg } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { MomentComposerProvider } from "@/components/moments/moment-composer-context";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";

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
    <MomentComposerProvider organisations={organisations ?? []}>
      <div className="flex min-h-screen bg-cream">
        {/* Iridescent washes: the shell's ambient light, drifting through
            hues so the parchment never reads as flat white */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
          <div
            className="animate-hue absolute -right-32 -top-44 h-[560px] w-[560px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(173,184,120,0.45), transparent 65%)",
              animationDuration: "9s",
            }}
          />
          <div
            className="animate-hue absolute -bottom-64 left-32 h-[640px] w-[640px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(232,213,163,0.4), transparent 65%)",
              animationDuration: "12s",
              animationDirection: "alternate-reverse",
            }}
          />
          <div
            className="absolute -left-48 top-44 h-[480px] w-[480px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(205,139,87,0.35), transparent 65%)",
            }}
          />
        </div>
        <Sidebar
          organisations={organisations}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
        />
        <div className="flex flex-1 flex-col md:pl-[236px]">
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
        <FeedbackWidget organisations={organisations ?? []} />
      </div>
    </MomentComposerProvider>
  );
}
