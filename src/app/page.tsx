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
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream">
      <h1 className="text-4xl font-bold text-bark">Mycelium</h1>
      <p className="mt-4 text-lg text-muted">
        What do your relationships need from you?
      </p>
      <Link
        href="/sign-in"
        className="mt-8 rounded-lg bg-terracotta px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark"
      >
        Get started
      </Link>
    </main>
  );
}
