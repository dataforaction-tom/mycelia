import Link from "next/link";

const INCLUDED = [
  "Moments — written or spoken, with automatic recognition",
  "The living network, stories and field notes",
  "Spaces, search and pattern detection",
  "Your whole team",
];

/** The one pricing card: flat £5, everything, 30-day free trial. */
export function PricingCard() {
  return (
    <div className="mx-auto w-full max-w-md rounded-[24px] border border-border bg-white/85 p-8 shadow-hover backdrop-blur">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
        One plan, everything included
      </p>
      <p className="mt-3 font-display text-6xl text-bark">
        £5
        <span className="ml-2 font-sans text-base text-muted">/ month</span>
      </p>
      <p className="mt-2 text-sm text-bark-light">
        No tiers. No add-ons. No &ldquo;contact sales&rdquo;.
      </p>

      <ul className="mt-6 space-y-2.5 text-sm text-bark">
        {INCLUDED.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-moss" />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href="/sign-in"
        className="mt-7 block w-full rounded-full bg-gradient-to-r from-green to-moss px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_8px_24px_rgba(111,154,79,0.35)] transition-all hover:brightness-105"
      >
        Start tending — free for 30 days
      </Link>
      <p className="mt-3 text-center text-xs text-muted">
        Every feature, no card required. £5/month after, cancel anytime.
      </p>
    </div>
  );
}
