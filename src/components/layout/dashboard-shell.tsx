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
      {/* Skip link: lets keyboard users jump past the sidebar's nav +
          org-switcher + user menu straight to page content (WCAG 2.4.1). */}
      <a
        href="#main-content"
        className="bg-terracotta-dark focus-visible:ring-terracotta focus-visible:ring-offset-cream sr-only rounded-lg px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Skip to main content
      </a>
      <div className="bg-cream flex min-h-screen">
        {/* Iridescent washes: the shell's ambient light, drifting through
            hues so the parchment never reads as flat white */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
        >
          <div
            className="animate-hue absolute -top-44 -right-32 h-[560px] w-[560px] rounded-full"
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
            className="absolute top-44 -left-48 h-[480px] w-[480px] rounded-full"
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
          <main id="main-content" className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
        <FeedbackWidget organisations={organisations ?? []} />
      </div>
    </MomentComposerProvider>
  );
}
