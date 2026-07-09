import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Sign a raw request body with HMAC-SHA256, returning a lowercase hex digest.
 * The signature is sent to subscribers so they can verify authenticity.
 */
export function sign(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

/**
 * Verify a signature against a freshly computed one using a constant-time
 * comparison. Returns false (never throws) if the inputs are malformed or the
 * signatures differ in length — a length mismatch is itself a mismatch, and
 * `timingSafeEqual` throws on unequal-length buffers.
 */
export function verify(rawBody: string, secret: string, signature: string): boolean {
  try {
    const expected = Buffer.from(sign(rawBody, secret), "hex");
    const provided = Buffer.from(signature, "hex");
    if (expected.length !== provided.length) {
      return false;
    }
    return timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

/**
 * Generate a fresh signing secret: 32 random bytes as 64 hex characters.
 */
export function generateSecret(): string {
  return randomBytes(32).toString("hex");
}
