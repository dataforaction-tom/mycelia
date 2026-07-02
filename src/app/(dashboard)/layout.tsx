import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <DashboardShell
      userName={session.user.name ?? undefined}
      userEmail={session.user.email ?? undefined}
      userImage={session.user.image ?? undefined}
    >
      {children}
    </DashboardShell>
  );
}
