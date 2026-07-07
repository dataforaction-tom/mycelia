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

// Statuses that mean the subscription no longer pays for the plan.
// `past_due` deliberately stays active — Stripe's dunning retries payment,
// and a `customer.subscription.deleted` event arrives if it finally fails.
const DEAD_STATUSES: Stripe.Subscription.Status[] = [
  "canceled",
  "unpaid",
  "incomplete_expired",
];

async function applySubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  if (DEAD_STATUSES.includes(subscription.status)) {
    await db
      .update(organisations)
      .set({
        plan: "trial",
        stripeSubscriptionId: null,
        updatedAt: new Date(),
      })
      .where(eq(organisations.stripeCustomerId, customerId));
    return;
  }

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

export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
) {
  await applySubscription(subscription);
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  await applySubscription(subscription);
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
