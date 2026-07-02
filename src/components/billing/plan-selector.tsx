"use client";

import { useState } from "react";
import { PlanCard } from "./plan-card";

const plans = [
  {
    key: "individual",
    name: "Individual",
    price: "\u00a35",
    features: [
      "1 user",
      "200 connections",
      "500 moments/month",
      "1 space",
      "Layer 1-2 AI features",
    ],
  },
  {
    key: "organisation",
    name: "Organisation",
    price: "\u00a325",
    features: [
      "Up to 10 users",
      "1,000 connections",
      "5,000 moments/month",
      "5 spaces",
      "Pattern recognition",
      "50 mutual connections",
    ],
  },
  {
    key: "large",
    name: "Large",
    price: "\u00a350",
    features: [
      "Up to 25 users (+\u00a32/extra)",
      "Unlimited connections",
      "Unlimited moments",
      "Unlimited spaces",
      "All AI features",
      "API access",
      "Priority support",
    ],
  },
];

export function PlanSelector({ orgSlug }: { orgSlug: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSelect(plan: string) {
    setLoading(plan);

    try {
      // In a real implementation, this would resolve the orgSlug to orgId
      // and call the checkout API
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, organisationId: orgSlug }),
      });

      const data = await res.json();

      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch {
      // Handle error silently - user can retry
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard
          key={plan.key}
          name={plan.name}
          price={plan.price}
          features={plan.features}
          onSelect={() => handleSelect(plan.key)}
          loading={loading === plan.key}
        />
      ))}
    </div>
  );
}
