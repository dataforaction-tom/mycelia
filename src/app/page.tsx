import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisationMemberships, organisations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
    <main className="underground relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* The living network, glowing beneath everything */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
      >
        <g stroke="#e8c97d" strokeWidth="1" strokeOpacity="0.25">
          <path d="M100 700 C300 620, 420 640, 560 520" />
          <path d="M560 520 C700 400, 820 470, 1080 380" />
          <path d="M560 520 C620 640, 780 660, 1100 700" />
          <path d="M200 180 C380 260, 460 400, 560 520" />
          <path d="M1080 380 C1000 240, 880 200, 720 120" />
          <path d="M100 700 C160 560, 140 420, 200 180" />
        </g>
        <g fill="#e8c97d">
          <circle cx="560" cy="520" r="5" fillOpacity="0.9" />
          <circle cx="1080" cy="380" r="4" fillOpacity="0.7" />
          <circle cx="200" cy="180" r="4" fillOpacity="0.7" />
          <circle cx="100" cy="700" r="3.5" fillOpacity="0.6" />
          <circle cx="720" cy="120" r="3" fillOpacity="0.5" />
          <circle cx="1100" cy="700" r="3" fillOpacity="0.5" />
        </g>
        <g fill="#a8dfc2">
          <circle cx="820" cy="470" r="3" fillOpacity="0.6" />
          <circle cx="420" cy="640" r="2.5" fillOpacity="0.5" />
          <circle cx="460" cy="400" r="2.5" fillOpacity="0.5" />
        </g>
      </svg>

      {/* Soft ambient blooms */}
      <div
        className="pointer-events-none absolute left-1/4 top-1/3 h-64 w-64 animate-drift rounded-full bg-spore/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-1/4 right-1/4 h-48 w-48 animate-drift rounded-full bg-hypha/10 blur-3xl [animation-delay:4s]"
        aria-hidden="true"
      />

      <div className="stagger-children relative z-10 max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-spore">
          Mycelium
        </p>
        <h1 className="mt-6 font-display text-5xl leading-tight text-soil-ink sm:text-6xl">
          What do your relationships need from you?
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg text-soil-ink-soft">
          Beneath every social purpose organisation is a living network of
          people, trust, and shared history. Mycelium helps you see it — and
          tend it.
        </p>
        <Link
          href="/sign-in"
          className="mt-10 inline-flex rounded-lg bg-terracotta px-7 py-3.5 text-sm font-medium text-white shadow-hover transition-all hover:bg-terracotta-dark"
        >
          Step inside
        </Link>
      </div>
    </main>
  );
}
