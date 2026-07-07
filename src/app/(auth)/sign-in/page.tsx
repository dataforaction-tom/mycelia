import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInForm } from "@/components/auth/sign-in-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in",
  description: "Sign in to your Tending account",
};

/** Relative in-app paths only — anything else invites an open redirect. */
function safeCallbackUrl(raw: string | undefined): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    verify?: string;
    callbackUrl?: string;
  }>;
}) {
  const { error, callbackUrl } = await searchParams;
  // The middleware sends signed-out visitors here with their original
  // destination as callbackUrl — preserve it so deep links round-trip.
  const destination = safeCallbackUrl(callbackUrl);

  // Already signed in? Straight through — landing on the sign-in form
  // while authenticated reads as a failed sign-in.
  const session = await auth();
  if (session?.user) redirect(destination);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl text-bark">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">
          The network kept growing while you were away.
        </p>
      </div>

      {error === "Verification" && (
        <div className="rounded-lg border border-amber/30 bg-amber/10 p-3 text-sm text-bark">
          That sign-in link has already been used or has expired — this can
          happen when an email scanner opens it first. Request a fresh one
          below; it only takes a moment.
        </div>
      )}
      {error && error !== "Verification" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Something went wrong signing you in. Request a fresh link below.
        </div>
      )}

      <SignInForm callbackUrl={destination} />
    </div>
  );
}
