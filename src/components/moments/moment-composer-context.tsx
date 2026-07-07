"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { MomentComposerModal } from "./moment-composer-modal";
import { ConnectionComposerModal } from "@/components/connections/connection-composer-modal";

interface ComposerOrg {
  id: string;
  slug: string;
}

interface ComposerContextValue {
  /** Open "Plant a moment", optionally pre-seeded (e.g. a connection's name). */
  openComposer: (options?: { seedText?: string }) => void;
  /** Open "Begin a thread" — the quick add-connection modal. */
  openConnectionComposer: () => void;
}

const ComposerContext = createContext<ComposerContextValue | null>(null);

/** Trigger the shared composers from anywhere under the dashboard. */
export function useMomentComposer(): ComposerContextValue {
  const ctx = useContext(ComposerContext);
  if (!ctx) {
    throw new Error(
      "useMomentComposer must be used within a MomentComposerProvider",
    );
  }
  return ctx;
}

export function MomentComposerProvider({
  organisations,
  children,
}: {
  organisations: ComposerOrg[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const orgSlug = pathname.split("/")[1] ?? "";
  const org = organisations.find((o) => o.slug === orgSlug);

  const [momentOpen, setMomentOpen] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [seedText, setSeedText] = useState<string | undefined>(undefined);

  const value = useMemo<ComposerContextValue>(
    () => ({
      openComposer: (options) => {
        setSeedText(options?.seedText);
        setMomentOpen(true);
      },
      openConnectionComposer: () => setConnectionOpen(true),
    }),
    [],
  );

  return (
    <ComposerContext.Provider value={value}>
      {children}
      {org && (
        <>
          <MomentComposerModal
            open={momentOpen}
            onOpenChange={(open) => {
              setMomentOpen(open);
              if (!open) setSeedText(undefined);
            }}
            organisationId={org.id}
            seedText={seedText}
          />
          <ConnectionComposerModal
            open={connectionOpen}
            onOpenChange={setConnectionOpen}
            organisationId={org.id}
            orgSlug={org.slug}
          />
        </>
      )}
    </ComposerContext.Provider>
  );
}
