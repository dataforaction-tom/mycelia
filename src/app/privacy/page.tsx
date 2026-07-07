import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Tending handles your data: what we store, which services process it, and your rights.",
};

const UPDATED = "7 July 2026";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <MarketingNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <h1 className="font-display text-4xl text-bark">Privacy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {UPDATED}</p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-bark">
          <section>
            <h2 className="font-display text-xl text-bark">The short version</h2>
            <p className="mt-2">
              Tending stores the relationship notes your organisation writes,
              uses AI services to understand them, and charges you through
              Stripe. We don&apos;t run ads, we don&apos;t sell data, and we
              don&apos;t use tracking analytics. Your network is yours.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-bark">What we store</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                <strong>Your account</strong> — your name and email address.
                Sign-in is passwordless: we email you a one-time link, so we
                never hold a password for you.
              </li>
              <li>
                <strong>Your organisation&apos;s data</strong> — the
                connections, moments, spaces, stories and observations your
                team creates. This lives in our hosted Postgres database
                (Neon) and is scoped to your organisation: members of other
                organisations can never see it.
              </li>
              <li>
                <strong>Billing records</strong> — handled by Stripe. Card
                details go directly to Stripe; we never see or store them.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-bark">
              AI processing — what leaves our database
            </h2>
            <p className="mt-2">
              Some features send data to third-party AI services to work:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                <strong>Understanding moments</strong> — the text of a moment
                (plus your organisation&apos;s connection names) is sent to
                language models via OpenRouter to recognise who is mentioned,
                detect dates, infer relationship-quality signals, and write
                relationship stories.
              </li>
              <li>
                <strong>Voice moments</strong> — if you speak a moment, the
                audio is sent to a transcription service (ElevenLabs or
                OpenAI) and converted to text. We keep the text as a moment;
                we do not store the audio.
              </li>
            </ul>
            <p className="mt-2">
              These providers process the data to provide the service. We
              don&apos;t use your data to train models.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-bark">Cookies</h2>
            <p className="mt-2">
              One cookie: your sign-in session. No advertising cookies, no
              third-party analytics, no fingerprinting.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-bark">Your rights</h2>
            <p className="mt-2">
              You can ask us at any time to export or permanently delete your
              account or your organisation&apos;s data — email{" "}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="text-terracotta-dark underline decoration-dotted underline-offset-2"
              >
                {siteConfig.contactEmail}
              </a>
              . If you&apos;re in the UK or EU, you have the usual GDPR
              rights: access, rectification, erasure, portability and
              objection. We&apos;ll respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-bark">Changes</h2>
            <p className="mt-2">
              If this policy changes in a way that matters, we&apos;ll tell
              signed-in users in the app and update the date at the top.
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
