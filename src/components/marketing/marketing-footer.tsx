import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

export function MarketingFooter({ dark = false }: { dark?: boolean }) {
  const base = dark ? "text-soil-ink-soft" : "text-muted";
  const link = dark
    ? "transition-colors hover:text-soil-ink"
    : "transition-colors hover:text-bark";

  return (
    <footer
      className={`relative z-10 flex flex-col items-center gap-3 px-6 py-10 text-center text-xs sm:flex-row sm:justify-between sm:text-left ${base}`}
    >
      <p>
        <span className="font-display text-sm">tending</span> · relationships
        are living things
      </p>
      <div className="flex items-center gap-5">
        <Link href="/pricing" className={link}>
          Pricing
        </Link>
        <Link href="/privacy" className={link}>
          Privacy
        </Link>
        <Link href="/terms" className={link}>
          Terms
        </Link>
        <a href={`mailto:${siteConfig.contactEmail}`} className={link}>
          Contact
        </a>
      </div>
    </footer>
  );
}
