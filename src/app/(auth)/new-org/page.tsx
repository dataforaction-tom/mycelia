import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OrgCreateForm } from "@/components/organisations/org-create-form";

export const dynamic = "force-dynamic";

export default async function NewOrgPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-bark">
          Create your organisation
        </h1>
        <p className="mt-2 text-sm text-muted">
          Give your team a home for their relationships.
        </p>
      </div>
      <OrgCreateForm />
    </div>
  );
}
