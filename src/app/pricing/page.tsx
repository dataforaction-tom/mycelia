import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { PricingCard } from "@/components/marketing/pricing-card";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Tending costs a flat £5 a month with everything included, after a 30-day free trial of all features — no card required.",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <MarketingNav />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
        <div className="max-w-lg text-center">
          <h1 className="font-display text-4xl text-bark">
            Pricing that fits in one sentence
          </h1>
          <p className="mt-3 text-muted">
            £5 a month, everything included, after a 30-day free trial of
            every feature. That&apos;s it — that&apos;s the pricing page.
          </p>
        </div>
        <PricingCard />
      </main>
      <MarketingFooter />
    </div>
  );
}
