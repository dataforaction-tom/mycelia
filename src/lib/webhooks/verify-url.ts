/**
 * SSRF guard for user-supplied webhook destination URLs.
 *
 * Blocks requests that could be used to reach internal infrastructure: cloud
 * metadata endpoints, loopback, and RFC1918 / link-local / unique-local ranges.
 * Only ordinary public https URLs pass (with a narrow http-to-localhost
 * exception for local development).
 */

/** Test whether an IPv4 literal falls in a private/loopback/link-local range. */
function isPrivateIpv4(hostname: string): boolean {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) {
    return false;
  }
  const octets = match.slice(1, 5).map(Number);
  if (octets.some((octet) => octet > 255)) {
    // Not a valid IPv4 literal; treat as a non-IP hostname.
    return false;
  }
  const [first, second] = octets;

  // 127.0.0.0/8 loopback
  if (first === 127) return true;
  // 10.0.0.0/8 private
  if (first === 10) return true;
  // 172.16.0.0/12 private
  if (first === 172 && second >= 16 && second <= 31) return true;
  // 192.168.0.0/16 private
  if (first === 192 && second === 168) return true;
  // 169.254.0.0/16 link-local (includes the 169.254.169.254 metadata IP)
  if (first === 169 && second === 254) return true;

  return false;
}

/** Test whether an IPv6 literal is loopback (::1) or unique-local (fc00::/7). */
function isPrivateIpv6(hostname: string): boolean {
  const normalised = hostname.toLowerCase();
  if (normalised === "::1") return true;
  // fc00::/7 — unique-local addresses start with fc or fd.
  if (normalised.startsWith("fc") || normalised.startsWith("fd")) return true;
  return false;
}

export function isSafeWebhookUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  // URL keeps the brackets on IPv6 hostnames; strip them for comparison.
  const hostname = parsed.hostname.replace(/^\[/, "").replace(/\]$/, "");
  const isProduction = process.env.NODE_ENV === "production";
  const isLocalhostHost = hostname === "localhost" || hostname === "127.0.0.1";

  // Local-dev exception: allow http to localhost / 127.0.0.1 only when we are
  // not in production. https to these hosts still falls through to the checks
  // below (and is rejected by the IP-range guard for 127.0.0.1).
  if (!isProduction && isLocalhostHost && parsed.protocol === "http:") {
    return true;
  }

  // Every other destination must be https.
  if (parsed.protocol !== "https:") {
    return false;
  }

  // Reject known-dangerous literal hostnames in production.
  if (isProduction && (hostname === "localhost" || hostname === "metadata.google.internal")) {
    return false;
  }

  // Reject IP literals in private / loopback / link-local ranges.
  if (isPrivateIpv4(hostname) || isPrivateIpv6(hostname)) {
    return false;
  }

  return true;
}
