"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * Interstitial between the emailed magic link and the actual Auth.js
 * callback URL that consumes the one-time token. Corporate link scanners
 * (Microsoft Safe Links, Proofpoint, Mimecast) prefetch every link in an
 * email to scan it for phishing — if we emailed the callback URL directly,
 * that prefetch would burn the token before the real user ever clicked.
 * Requiring an actual button press here means only a genuine click reaches
 * the token-consuming URL.
 */
export function ConfirmSignInClient() {
  const searchParams = useSearchParams();
  const [clicked, setClicked] = useState(false);

  const targetUrl = useMemo(() => {
    const raw = searchParams.get("url");
    if (!raw) return null;
    try {
      const parsed = new URL(raw);
      // Only ever forward to our own Auth.js callback — anything else would
      // turn this page into an open redirect.
      if (
        parsed.origin !== window.location.origin ||
        !parsed.pathname.startsWith("/api/auth/callback/")
      ) {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  }, [searchParams]);

  if (!targetUrl) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="font-display text-2xl text-bark">
          That link isn&apos;t valid
        </h1>
        <p className="text-sm text-muted">
          Request a fresh sign-in link and try again.
        </p>
        <Link
          href="/sign-in"
          className="inline-block text-sm font-medium text-terracotta hover:text-terracotta-dark"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div>
        <h1 className="font-display text-2xl text-bark">Step inside</h1>
        <p className="mt-2 text-sm text-muted">
          Confirm you&apos;d like to sign in to Tending.
        </p>
      </div>
      <button
        type="button"
        disabled={clicked}
        onClick={() => {
          setClicked(true);
          window.location.href = targetUrl;
        }}
        className="w-full rounded-lg bg-terracotta px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark disabled:opacity-50"
      >
        {clicked ? "Signing you in…" : "Continue to sign in"}
      </button>
    </div>
  );
}
