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
              ? "text-soil-ink-soft transition-colors hover:text-soil-ink"
              : "text-bark-light transition-colors hover:text-bark"
          }
        >
          Pricing
        </Link>
        <Link
          href="/sign-in"
          className={
            dark
              ? "rounded-full border border-spore/40 px-4 py-2 font-medium text-spore transition-colors hover:bg-spore/10"
              : "rounded-full bg-terracotta px-4 py-2 font-medium text-white shadow-lift transition-all hover:bg-terracotta-dark"
          }
        >
          Sign in
        </Link>
      </div>
    </nav>
  );
}
