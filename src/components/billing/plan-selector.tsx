"use client";

import { useState } from "react";

interface PlanSelectorProps {
  organisationId: string;
  plan: string;
  trialEndsAt: string | null;
}

const INCLUDED = [
  "Unlimited team members on your plan tier",
  "Living network, stories and field notes",
  "Voice moments and AI understanding",
  "Spaces, search and pattern detection",
];

/**
 * Pricing is flat: £5 a month, everything included, after a 30-day free
 * trial with no card required. One plan, one card, no comparison grid.
 */
export function PlanSelector({
  organisationId,
  plan,
  trialEndsAt,
}: PlanSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onTrial = plan === "trial";
  const trialExpired =
    onTrial && (!trialEndsAt || new Date(trialEndsAt).getTime() < Date.now());
  const trialEnd = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  async function startCheckout() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "individual", organisationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      if (data.data?.url) window.location.href = data.data.url;
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function openBillingPortal() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      if (data.data?.url) window.location.href = data.data.url;
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="border-border shadow-lift max-w-md rounded-[20px] border bg-white/85 p-6">
      {error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-lg border p-3 text-sm"
        >
          {error}
        </div>
      )}

      <p className="text-muted text-xs font-medium tracking-[0.12em] uppercase">
        The plan
      </p>
      <p className="font-display text-bark mt-2 text-4xl">
        £5
        <span className="text-muted ml-1 font-sans text-sm">/ month</span>
      </p>
      <p className="text-bark-light mt-1 text-sm">
        Everything included. No tiers, no add-ons.
      </p>

      <ul className="text-bark mt-4 space-y-2 text-sm">
        {INCLUDED.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="bg-moss mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
            {feature}
          </li>
        ))}
      </ul>

      {onTrial ? (
        <>
          {trialExpired ? (
            <p className="bg-amber/10 text-amber-dark mt-5 rounded-lg px-3 py-2 text-xs">
              Your free trial ended{trialEnd ? ` on ${trialEnd}` : ""} — Tending
              is read-only until you subscribe. Everything you planted is safe.
            </p>
          ) : (
            trialEnd && (
              <p className="bg-moss/10 text-moss-dark mt-5 rounded-lg px-3 py-2 text-xs">
                You&apos;re on the free trial — every feature, no card needed.
                It ends on {trialEnd}.
              </p>
            )
          )}
          <button
            type="button"
            onClick={startCheckout}
            disabled={isLoading}
            className="from-green-dark to-moss-dark shadow-lift mt-4 w-full rounded-full bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-105 disabled:opacity-50"
          >
            {isLoading ? "One moment…" : "Subscribe — £5/month"}
          </button>
        </>
      ) : (
        <>
          <p className="bg-moss/10 text-moss-dark mt-5 rounded-lg px-3 py-2 text-xs">
            You&apos;re subscribed. Thank you for tending with us.
          </p>
          <button
            type="button"
            onClick={openBillingPortal}
            disabled={isLoading}
            className="border-border bg-surface text-bark hover:bg-cream-dark mt-4 w-full rounded-full border px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? "One moment…" : "Manage billing"}
          </button>
        </>
      )}
    </div>
  );
}
