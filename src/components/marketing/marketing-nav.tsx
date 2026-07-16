import Link from "next/link";

/** Top nav for public pages: wordmark home, pricing, sign in. */
export function MarketingNav({ dark = false }: { dark?: boolean }) {
  return (
    <nav
      className={`relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 ${
        dark ? "text-soil-ink" : "text-bark"
      }`}
    >
      <Link
        href="/"
        className={`font-display text-2xl ${dark ? "text-soil-ink" : "text-bark-dark"}`}
      >
        tending
      </Link>
      <div className="flex items-center gap-6 text-sm">
        <Link
          href="/pricing"
          className={
            dark
              ? "text-soil-ink-soft hover:text-soil-ink transition-colors"
              : "text-bark-light hover:text-bark transition-colors"
          }
        >
          Pricing
        </Link>
        <Link
          href="/sign-in"
          className={
            dark
              ? "border-spore/40 text-spore hover:bg-spore/10 rounded-full border px-4 py-2 font-medium transition-colors"
              : "bg-terracotta shadow-lift hover:bg-terracotta-dark rounded-full px-4 py-2 font-medium text-white transition-all"
          }
        >
          Sign in
        </Link>
      </div>
    </nav>
  );
}
