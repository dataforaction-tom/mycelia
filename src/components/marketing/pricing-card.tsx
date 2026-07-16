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
    <div className="border-border shadow-hover mx-auto w-full max-w-md rounded-[24px] border bg-white/85 p-8 backdrop-blur">
      <p className="text-muted text-xs font-medium tracking-[0.12em] uppercase">
        One plan, everything included
      </p>
      <p className="font-display text-bark mt-3 text-6xl">
        £5
        <span className="text-muted ml-2 font-sans text-base">/ month</span>
      </p>
      <p className="text-bark-light mt-2 text-sm">
        No tiers. No add-ons. No &ldquo;contact sales&rdquo;.
      </p>

      <ul className="text-bark mt-6 space-y-2.5 text-sm">
        {INCLUDED.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <span className="bg-moss mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href="/sign-in"
        className="from-green-dark to-moss-dark mt-7 block w-full rounded-full bg-gradient-to-r px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_8px_24px_rgba(111,154,79,0.35)] transition-all hover:brightness-105"
      >
        Start tending — free for 30 days
      </Link>
      <p className="text-muted mt-3 text-center text-xs">
        Every feature, no card required. £5/month after, cancel anytime.
      </p>
    </div>
  );
}
