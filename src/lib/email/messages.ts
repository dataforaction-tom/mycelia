import { siteConfig } from "@/lib/config/site";
import { renderEmail } from "./template";
import { sendEmail } from "./send";

/**
 * Every transactional email Tending sends, one function each. The magic
 * link must throw on failure (NextAuth needs to know); everything else is
 * called best-effort by its trigger.
 */

export async function sendMagicLinkEmail(to: string, url: string) {
  const { html, text } = renderEmail({
    preheader: "Your sign-in link for Tending — it works once and expires in 24 hours.",
    heading: "Step inside",
    paragraphs: [
      "Here's your sign-in link for Tending. It works once, from any device.",
    ],
    cta: { label: "Sign in to Tending", url },
    footerNote:
      "The link expires in 24 hours. If you didn't ask for it, you can safely ignore this email — nobody can sign in without it.",
  });
  return sendEmail({ to, subject: "Step inside — your sign-in link", html, text });
}

export async function sendWelcomeEmail(
  to: string,
  orgName: string,
  orgSlug: string,
) {
  const { html, text } = renderEmail({
    preheader: `${orgName} is planted. Your 30-day free trial of everything starts now.`,
    heading: "Welcome to Tending",
    paragraphs: [
      `${orgName} is planted, and your 30-day free trial of every feature starts now — no card needed.`,
      "A good first hour: plant a moment about a conversation you had this week, watch the people you mention become living threads, and open the network to see it breathe.",
      "It's £5 a month after the trial, everything included.",
    ],
    cta: { label: "Open your ecosystem", url: `${siteConfig.url}/${orgSlug}` },
  });
  return sendEmail({ to, subject: `Welcome to Tending — ${orgName} is planted`, html, text });
}

export async function sendMemberAddedEmail(
  to: string,
  orgName: string,
  orgSlug: string,
  inviterName: string,
) {
  const { html, text } = renderEmail({
    preheader: `${inviterName} added you to ${orgName} on Tending.`,
    heading: `You've been added to ${orgName}`,
    paragraphs: [
      `${inviterName} added you to ${orgName} on Tending — a shared, living map of the relationships your organisation is tending.`,
      "Sign in with this email address and you'll land right in the ecosystem.",
    ],
    cta: { label: `Open ${orgName}`, url: `${siteConfig.url}/${orgSlug}` },
  });
  return sendEmail({
    to,
    subject: `${inviterName} added you to ${orgName} on Tending`,
    html,
    text,
  });
}

export async function sendTrialEndingEmail(
  to: string,
  orgName: string,
  orgSlug: string,
  trialEndsAt: Date,
) {
  // "today" / "tomorrow" / "in N days" by calendar date — a trial ending
  // this afternoon must never be described as ending tomorrow.
  const { trialEndDescriptor } = await import("@/lib/billing/subscription");
  const when = trialEndDescriptor(trialEndsAt);
  const { html, text } = renderEmail({
    preheader: `Your free trial for ${orgName} ends ${when}.`,
    heading: `Your trial ends ${when}`,
    paragraphs: [
      `Your free trial for ${orgName} ends ${when}. After that, Tending goes read-only — everything you've planted stays safe and visible, you just can't add to it.`,
      "Keep tending for £5 a month, everything included, cancel anytime.",
    ],
    cta: {
      label: "Subscribe — £5/month",
      url: `${siteConfig.url}/${orgSlug}/settings/billing`,
    },
    footerNote:
      "If you'd rather let the trial lapse, no action needed — your data is kept and you can subscribe later.",
  });
  return sendEmail({
    to,
    subject: `Your Tending trial ends ${when} — ${orgName}`,
    html,
    text,
  });
}

export async function sendSubscriptionConfirmedEmail(
  to: string,
  orgName: string,
  orgSlug: string,
) {
  const { html, text } = renderEmail({
    preheader: `Your Tending subscription for ${orgName} is active.`,
    heading: "You're subscribed — thank you for tending",
    paragraphs: [
      `Your subscription for ${orgName} is active: £5 a month, everything included, cancel anytime.`,
      "Receipts come from Stripe, and you can manage or cancel your subscription from billing settings whenever you need.",
    ],
    cta: {
      label: "Billing settings",
      url: `${siteConfig.url}/${orgSlug}/settings/billing`,
    },
  });
  return sendEmail({
    to,
    subject: `You're subscribed — ${orgName} on Tending`,
    html,
    text,
  });
}

export async function sendSubscriptionEndedEmail(
  to: string,
  orgName: string,
  orgSlug: string,
) {
  const { html, text } = renderEmail({
    preheader: `Your Tending subscription for ${orgName} has ended.`,
    heading: "Your subscription has ended",
    paragraphs: [
      `The subscription for ${orgName} has ended, so Tending is read-only for now — you can still see everything, you just can't plant new moments.`,
      "Everything you've grown is safe and stays yours. Resubscribe whenever you're ready and carry on exactly where you left off.",
    ],
    cta: {
      label: "Resubscribe — £5/month",
      url: `${siteConfig.url}/${orgSlug}/settings/billing`,
    },
  });
  return sendEmail({
    to,
    subject: `Your Tending subscription for ${orgName} has ended`,
    html,
    text,
  });
}
