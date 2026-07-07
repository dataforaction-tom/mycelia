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
import { PLAN_PRICES } from "@/lib/config/plans";
import { eq } from "drizzle-orm";
import { z } from "zod/v3";

// Flat pricing: "individual" is the only plan on sale.
const checkoutSchema = z.object({
  organisationId: z.string().uuid(),
  plan: z.literal("individual"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

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

    // Create or reuse Stripe customer
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email ?? undefined,
        metadata: { organisationId: org.id },
      });
      customerId = customer.id;

      await db
        .update(organisations)
        .set({ stripeCustomerId: customerId })
        .where(eq(organisations.id, org.id));
    }

    const priceConfig = PLAN_PRICES[parsed.data.plan];

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceConfig.stripePriceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${org.slug}/settings/billing?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${org.slug}/settings/billing?cancelled=1`,
      metadata: { organisationId: org.id },
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
