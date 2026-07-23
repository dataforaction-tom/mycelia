import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create an account",
  description: "Create your Tending account",
};

/** Relative in-app paths only — anything else invites an open redirect. */
function safeCallbackUrl(raw: string | undefined): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/new-org";
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const destination = safeCallbackUrl(callbackUrl);

  const session = await auth();
  if (session?.user) redirect(destination);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl text-bark">Plant your first moment</h1>
        <p className="mt-2 text-sm text-muted">
          Create an account to start tending your network.
        </p>
      </div>

      <SignUpForm callbackUrl={destination} />

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-terracotta hover:text-terracotta-dark"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
