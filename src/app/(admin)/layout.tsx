import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth/platform";
import { AdminShell } from "@/components/layout/admin-shell";

/**
 * Platform-admin route group. The first-ever platform-level authorization in
 * the app. Non-admins get notFound() (a 404) rather than a redirect, so the
 * panel's existence isn't revealed. API routes under /api/admin must guard
 * themselves — middleware skips /api.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!isSuperAdmin(session)) {
    notFound();
  }

  return (
    <AdminShell
      userName={session!.user.name ?? undefined}
      userEmail={session!.user.email ?? undefined}
    >
      {children}
    </AdminShell>
  );
}
