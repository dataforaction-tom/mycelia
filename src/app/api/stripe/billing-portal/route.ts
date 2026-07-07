import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe";
import {
  successResponse,
  errorResponse,
  getAuthenticatedUser,
} from "@/lib/utils/api";
import { requireMembership } from "@/lib/auth/permissions";
import { eq } from "drizzle-orm";
import { z } from "zod/v3";

const portalSchema = z.object({
  organisationId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const body = await request.json();
    const parsed = portalSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    await requireMembership(user.id, parsed.data.organisationId, "owner");

    const [org] = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, parsed.data.organisationId))
      .limit(1);

    if (!org) return errorResponse("Organisation not found", 404);

    if (!org.stripeCustomerId) {
      return errorResponse("No billing account found", 400);
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/${org.slug}/settings/billing`,
    });

    return successResponse({ url: session.url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg === "Not authenticated") return errorResponse(msg, 401);
    if (msg.includes("Not a member") || msg.includes("Insufficient role"))
      return errorResponse(msg, 403);
    if (msg.includes("Stripe is not configured"))
      return errorResponse("Billing is not configured yet", 503);
    return errorResponse("Internal server error", 500);
  }
}
