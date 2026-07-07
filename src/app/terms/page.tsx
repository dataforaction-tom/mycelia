import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms of service for Tending, in plain language.",
};

const UPDATED = "7 July 2026";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <MarketingNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <h1 className="font-display text-4xl text-bark">Terms of service</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {UPDATED}</p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-bark">
          <section>
            <h2 className="font-display text-xl text-bark">The service</h2>
            <p className="mt-2">
              Tending is a relationship management tool for social purpose
              organisations, provided as a web application at
              tending.network. Every feature is included in one plan.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-bark">
              Trials, payment and cancellation
            </h2>
            <p className="mt-2">
              New organisations get a 30-day free trial of everything, no
              card required. After that it&apos;s £5 a month per
              organisation, billed through Stripe. Cancel anytime from your
              billing settings; you keep access until the end of the paid
              period. If a trial lapses without a subscription, your data is
              kept for 90 days so you can come back, then may be deleted.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-bark">Your data</h2>
            <p className="mt-2">
              Your organisation&apos;s data belongs to your organisation. We
              process it only to provide the service, as described in the{" "}
              <Link
                href="/privacy"
                className="text-terracotta-dark underline decoration-dotted underline-offset-2"
              >
                privacy policy
              </Link>
              . You can export or delete it at any time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-bark">Acceptable use</h2>
            <p className="mt-2">
              Don&apos;t use Tending to store data you have no right to hold,
              to harass people, or to break the law. Remember the people in
              your network are people — hold their information with the same
              care you&apos;d want for your own.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-bark">
              Service and liability
            </h2>
            <p className="mt-2">
              We work to keep Tending fast, safe and available, but it is
              provided &ldquo;as is&rdquo; without warranty. AI-generated
              content (stories, observations, quality signals) is suggestive,
              not authoritative — check before acting on it. Our total
              liability is capped at the amount you&apos;ve paid us in the
              last 12 months.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-bark">Changes & contact</h2>
            <p className="mt-2">
              We may update these terms; material changes will be flagged in
              the app. These terms are governed by the laws of England and
              Wales. Questions:{" "}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="text-terracotta-dark underline decoration-dotted underline-offset-2"
              >
                {siteConfig.contactEmail}
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
