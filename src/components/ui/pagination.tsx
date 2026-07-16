import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  /** Current query params to preserve across page changes (e.g. search `q`). */
  params?: Record<string, string | undefined>;
}

/**
 * Server-friendly pagination — pure links, no client state. Preserves the
 * existing query params (search, filters) and only swaps `page`, so it
 * composes with the auto-submitting GET filter forms used across the app.
 */
export function Pagination({
  page,
  totalPages,
  basePath,
  params,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value) search.set(key, value);
    }
    search.set("page", String(target));
    return `${basePath}?${search.toString()}`;
  };

  const base =
    "inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm transition-colors";

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <span className="text-muted text-xs">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={href(page - 1)}
            className={cn(base, "bg-surface text-bark hover:bg-cream-dark")}
          >
            Previous
          </Link>
        ) : (
          <span
            className={cn(base, "text-muted cursor-not-allowed opacity-50")}
          >
            Previous
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={href(page + 1)}
            className={cn(base, "bg-surface text-bark hover:bg-cream-dark")}
          >
            Next
          </Link>
        ) : (
          <span
            className={cn(base, "text-muted cursor-not-allowed opacity-50")}
          >
            Next
          </span>
        )}
      </div>
    </div>
  );
}
