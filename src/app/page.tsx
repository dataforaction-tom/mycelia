import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisationMemberships, organisations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { LandingComposerDemo } from "@/components/marketing/landing-composer-demo";
import { PricingCard } from "@/components/marketing/pricing-card";
import { Filaments } from "@/components/network/filaments";
import { Spores } from "@/components/network/spores";

export const dynamic = "force-dynamic";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: siteConfig.url,
  description: siteConfig.description,
  offers: {
    "@type": "Offer",
    price: "5.00",
    priceCurrency: "GBP",
    description:
      "£5 per month, everything included, after a 30-day free trial of all features — no card required.",
  },
};

/** A breathing node in the hero network. */
function HeroNode({
  cx,
  cy,
  r,
  fill,
  delay = 0,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  delay?: number;
}) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      className="animate-breathe"
      style={{
        transformBox: "fill-box",
        transformOrigin: "center",
        animationDelay: `${delay}s`,
        filter: `drop-shadow(0 0 ${Math.max(8, r * 0.6)}px ${fill})`,
      }}
    />
  );
}

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    // Find user's first org and redirect there
    const [membership] = await db
      .select({ slug: organisations.slug })
      .from(organisationMemberships)
      .innerJoin(
        organisations,
        eq(organisationMemberships.organisationId, organisations.id),
      )
      .where(eq(organisationMemberships.userId, session.user.id))
      .limit(1);

    if (membership) {
      redirect(`/${membership.slug}`);
    }

    // Authenticated but no org — send to org creation
    redirect("/new-org");
  }

  return (
    <div className="bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* ===== Hero: under the soil ===== */}
      <section className="underground relative flex min-h-screen flex-col overflow-hidden rounded-none border-none">
        <MarketingNav dark />
        <Spores count={6} seed={29} />
        <Filaments width={1200} height={160} count={9} seed={29} />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h1 className="font-display text-5xl leading-[1.1] text-soil-ink sm:text-6xl">
              Relationships are living things.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-soil-ink-soft">
              Beneath every social purpose organisation is a living network of
              people, trust and shared history. Tending helps you see it —
              and tend it. Not a CRM. A garden.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/sign-in"
                className="rounded-full bg-gradient-to-r from-green to-moss px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(111,154,79,0.45)] transition-all hover:brightness-105"
              >
                Start tending — free for 30 days
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-soil-ink-soft underline decoration-spore/40 decoration-dotted underline-offset-4 transition-colors hover:text-soil-ink"
              >
                £5 a month after. That&apos;s the whole pricing page.
              </Link>
            </div>
          </div>

          {/* The living network, hand-composed per the prototype */}
          <svg
            viewBox="0 0 540 480"
            className="w-full"
            aria-hidden="true"
          >
            <g
              stroke="var(--spore)"
              strokeOpacity="0.3"
              strokeWidth="1.6"
              fill="none"
              className="animate-thread-flow"
            >
              <path d="M270 240 C 220 200, 180 175, 150 135" />
              <path d="M270 240 C 330 205, 370 180, 400 150" />
              <path d="M270 240 C 220 285, 175 315, 130 340" />
              <path d="M270 240 C 330 285, 375 325, 410 360" />
              <path d="M270 240 C 278 185, 283 145, 290 100" />
              <path d="M270 240 C 250 305, 230 360, 215 420" />
              <path d="M400 150 C 435 180, 465 210, 490 240" />
              <path d="M150 135 C 190 122, 240 110, 290 100" />
              <path d="M410 360 C 345 390, 280 405, 215 420" />
            </g>
            <HeroNode cx={270} cy={240} r={26} fill="#e8d5a3" />
            <HeroNode cx={150} cy={135} r={15} fill="#adb878" delay={1} />
            <HeroNode cx={400} cy={150} r={18} fill="#c4a184" delay={0.5} />
            <HeroNode cx={130} cy={340} r={12} fill="#cd8b57" delay={2} />
            <HeroNode cx={410} cy={360} r={15} fill="#e8d5a3" delay={1.4} />
            <HeroNode cx={290} cy={100} r={11} fill="#adb878" delay={2.6} />
            <HeroNode cx={215} cy={420} r={13} fill="#c4a184" delay={0.8} />
            <HeroNode cx={490} cy={240} r={9} fill="#c9ad6e" delay={1.8} />
            <g
              fontSize="12"
              fill="#ddd1ba"
              textAnchor="middle"
              fontFamily="inherit"
            >
              <text x={270} y={286}>
                Rooted Futures
              </text>
              <text x={150} y={110}>
                Amara Okafor
              </text>
              <text x={400} y={124}>
                Riverside Collective
              </text>
              <text x={410} y={394}>
                St Mary&apos;s
              </text>
              <text x={130} y={368}>
                Marcus Webb
              </text>
              <text x={215} y={448}>
                Hope Street Group
              </text>
            </g>
          </svg>
        </div>

        <p className="relative z-10 pb-8 text-center text-xs uppercase tracking-[0.2em] text-soil-ink-soft/70">
          Under the soil — your living network
        </p>
      </section>

      {/* ===== The modal in flow ===== */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-28">
        <div
          aria-hidden="true"
          className="animate-hue pointer-events-none absolute -right-32 -top-44 h-[560px] w-[560px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(173,184,120,0.35), transparent 65%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl text-bark">
            Write it as you&apos;d tell a colleague
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            No forms, no fields, no filing. One sentence — spoken or typed —
            and tending recognises who was there, where it happened, and
            grows the threads between them.
          </p>
        </div>
        <div className="relative mt-12">
          <LandingComposerDemo />
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 text-sm sm:grid-cols-3">
          <div className="text-center">
            <p className="font-semibold text-bark">Recognised, not filed</p>
            <p className="mt-1.5 text-muted">
              People, organisations and places are picked out as you type —
              instantly, on your own roster.
            </p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-bark">Speak it</p>
            <p className="mt-1.5 text-muted">
              On the way back from the meeting, just say what happened.
              Tending transcribes and plants it.
            </p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-bark">Threads grow</p>
            <p className="mt-1.5 text-muted">
              Every moment strengthens the network — no extra admin, ever.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Three worlds ===== */}
      <section className="mx-auto max-w-6xl px-6 pb-20 sm:pb-28">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[20px] border border-border bg-white/80 p-7 shadow-lift">
            <h3 className="font-display text-2xl text-bark">
              The river of moments
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-bark-light">
              Everything that happened, as it flowed. First meetings, growing
              trust, wobbles cleared over coffee — the real texture of your
              work, kept.
            </p>
          </div>
          <div className="underground relative overflow-hidden rounded-[20px] p-7">
            <Filaments width={400} height={70} count={5} seed={13} />
            <Spores count={3} seed={13} />
            <h3 className="relative font-display text-2xl text-soil-ink">
              Under the soil
            </h3>
            <p className="relative mt-3 text-sm leading-relaxed text-soil-ink-soft">
              The living network itself — breathing nodes, flowing threads.
              Brighter means warmer, closer means stronger. Quiet
              relationships fade so you notice before they&apos;re gone.
            </p>
          </div>
          <div className="rounded-[20px] border border-border bg-white/80 p-7 shadow-lift">
            <h3 className="font-display text-2xl text-bark">Field notes</h3>
            <p className="mt-3 text-sm leading-relaxed text-bark-light">
              Patterns the network shows you — noticed, not measured. A
              cluster quietly forming. A thread going quiet. A relationship
              that depends entirely on one person.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section className="px-6 pb-24">
        <div className="mx-auto mb-10 max-w-lg text-center">
          <h2 className="font-display text-4xl text-bark">
            One plan. Five pounds.
          </h2>
        </div>
        <PricingCard />
      </section>

      <MarketingFooter />
    </div>
  );
}
