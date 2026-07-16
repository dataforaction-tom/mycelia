import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison for secrets (cron bearer tokens, shared
 * keys). A plain `===` / `!==` short-circuits on the first differing byte,
 * leaking length and prefix information through timing. `timingSafeEqual`
 * requires equal-length buffers, so we length-check first (itself not secret)
 * and compare only when lengths match.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/** Validate an `Authorization: Bearer <secret>` header in constant time. */
export function isValidBearer(
  header: string | null,
  secret: string,
): boolean {
  if (!header) return false;
  return safeEqual(header, `Bearer ${secret}`);
}
