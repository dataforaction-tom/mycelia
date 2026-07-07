import { db } from "@/lib/db";
import {
  organisations,
  organisationMemberships,
  users,
} from "@/lib/db/schema";
import {
  sendSubscriptionConfirmedEmail,
  sendSubscriptionEndedEmail,
} from "@/lib/email/messages";
import { and, eq } from "drizzle-orm";
import type Stripe from "stripe";

/** The org (and its owner's email) behind a Stripe customer id. */
async function orgForCustomer(customerId: string) {
  const [row] = await db
    .select({
      name: organisations.name,
      slug: organisations.slug,
      ownerEmail: users.email,
    })
    .from(organisations)
    .innerJoin(
      organisationMemberships,
      and(
        eq(organisationMemberships.organisationId, organisations.id),
        eq(organisationMemberships.role, "owner"),
      ),
    )
    .innerJoin(users, eq(users.id, organisationMemberships.userId))
    .where(eq(organisations.stripeCustomerId, customerId))
    .limit(1);
  return row;
}

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

  // Confirmation only here — subscription.updated fires on every change
  // and must never trigger repeat emails. Best-effort: webhooks 200 fast.
  if (!DEAD_STATUSES.includes(subscription.status)) {
    try {
      const org = await orgForCustomer(subscription.customer as string);
      if (org?.ownerEmail) {
        await sendSubscriptionConfirmedEmail(org.ownerEmail, org.name, org.slug);
      }
    } catch {
      // The plan flip is what matters; the email is a courtesy.
    }
  }
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

  try {
    const org = await orgForCustomer(customerId);
    if (org?.ownerEmail) {
      await sendSubscriptionEndedEmail(org.ownerEmail, org.name, org.slug);
    }
  } catch {
    // The revert already happened; the email is a courtesy.
  }
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
