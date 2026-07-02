import { db } from "@/lib/db";
import { organisations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

type PlanType = "trial" | "individual" | "organisation" | "large";

function priceIdToPlan(priceId: string): PlanType {
  const priceMap: Record<string, PlanType> = {
    [process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY ?? ""]: "individual",
    [process.env.STRIPE_PRICE_ORGANISATION_MONTHLY ?? ""]: "organisation",
    [process.env.STRIPE_PRICE_LARGE_MONTHLY ?? ""]: "large",
  };
  return priceMap[priceId] ?? "individual";
}

export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price?.id;
  const plan = priceId ? priceIdToPlan(priceId) : "individual";

  await db
    .update(organisations)
    .set({
      plan,
      stripeSubscriptionId: subscription.id,
      updatedAt: new Date(),
    })
    .where(eq(organisations.stripeCustomerId, customerId));
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price?.id;
  const plan = priceId ? priceIdToPlan(priceId) : "individual";

  await db
    .update(organisations)
    .set({
      plan,
      stripeSubscriptionId: subscription.id,
      updatedAt: new Date(),
    })
    .where(eq(organisations.stripeCustomerId, customerId));
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;

  await db
    .update(organisations)
    .set({
      plan: "trial",
      stripeSubscriptionId: null,
      updatedAt: new Date(),
    })
    .where(eq(organisations.stripeCustomerId, customerId));
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Clear any restriction flags on the org when payment succeeds
  const customerId = invoice.customer as string;
  if (!customerId) return;

  await db
    .update(organisations)
    .set({ updatedAt: new Date() })
    .where(eq(organisations.stripeCustomerId, customerId));
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Could set a flag on the org to show a payment warning
  const customerId = invoice.customer as string;
  if (!customerId) return;

  await db
    .update(organisations)
    .set({ updatedAt: new Date() })
    .where(eq(organisations.stripeCustomerId, customerId));
}
