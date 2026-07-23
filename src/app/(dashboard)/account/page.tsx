import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { SetPasswordForm } from "@/components/auth/set-password-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Account",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [user] = await db
    .select({ email: users.email, hasPassword: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bark">Account</h1>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-bark">Password</h2>
          <p className="mt-1 text-sm text-muted">
            {user.hasPassword
              ? "Sign in with your password, or a magic link — whichever's handy."
              : "You currently sign in with a magic link. Set a password for a faster way in."}
          </p>
        </div>
        <SetPasswordForm hasPassword={Boolean(user.hasPassword)} />
      </div>
    </div>
  );
}
