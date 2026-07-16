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

  // 0.0.0.0/8 "this host" / unspecified. 0.0.0.0 is not routable as a
  // destination but on Linux it resolves to loopback, making it a common SSRF
  // bypass for reaching services bound to localhost.
  if (first === 0) return true;
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

/**
 * Convert a pair of 16-bit hex groups (the last 32 bits of an IPv6 literal)
 * into a dotted-decimal IPv4 string. Used to unwrap the IPv4 address embedded
 * in IPv4-mapped and NAT64 IPv6 addresses so it can be run through the IPv4
 * guard. Returns null if either group is not valid hex.
 */
function hexPairToIpv4(highGroup: string, lowGroup: string): string | null {
  const high = parseInt(highGroup, 16);
  const low = parseInt(lowGroup, 16);
  if (Number.isNaN(high) || Number.isNaN(low)) {
    return null;
  }
  // high holds octets 1-2, low holds octets 3-4.
  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
}

/**
 * Extract the IPv4 address embedded in the final 32 bits of an IPv6 literal.
 * Node's URL parser may emit either the dotted tail form (`::ffff:1.2.3.4`) or
 * a hex form (`::ffff:0102:0304`), so both are handled. Returns null when no
 * IPv4 tail can be recovered.
 */
function embeddedIpv4(normalised: string): string | null {
  const groups = normalised.split(":").filter((group) => group.length > 0);
  if (groups.length === 0) {
    return null;
  }
  const last = groups[groups.length - 1];
  // Dotted tail, e.g. ::ffff:169.254.169.254 or 64:ff9b::10.0.0.1
  if (last.includes(".")) {
    return last;
  }
  // Hex tail: the final two 16-bit groups carry the 32-bit IPv4 value.
  if (groups.length < 2) {
    return null;
  }
  return hexPairToIpv4(groups[groups.length - 2], last);
}

/**
 * Test whether an IPv6 literal reaches internal infrastructure: loopback,
 * unspecified, unique-local, or an internal IPv4 smuggled via an IPv4-mapped
 * or NAT64 address.
 */
function isPrivateIpv6(hostname: string): boolean {
  try {
    const normalised = hostname.toLowerCase();

    // :: unspecified / "any" address. Like 0.0.0.0 it commonly resolves to
    // loopback, so it must not be an allowed destination.
    if (normalised === "::" || normalised === "0:0:0:0:0:0:0:0") return true;
    // ::1 loopback.
    if (normalised === "::1") return true;
    // fc00::/7 — unique-local addresses start with fc or fd.
    if (normalised.startsWith("fc") || normalised.startsWith("fd")) return true;
    // fe80::/10 link-local (includes the IPv6 metadata/router-local range).
    if (
      normalised.startsWith("fe8") ||
      normalised.startsWith("fe9") ||
      normalised.startsWith("fea") ||
      normalised.startsWith("feb")
    )
      return true;
    // ff00::/8 multicast.
    if (normalised.startsWith("ff")) return true;

    // IPv4-mapped (::ffff:0:0/96) and NAT64 (64:ff9b::/96) both embed an IPv4
    // address in their last 32 bits. Attackers use these to wrap an internal
    // IPv4 (loopback, link-local metadata, RFC1918) inside an IPv6 literal that
    // slips past a naive IPv6 check. Unwrap the IPv4 and apply the IPv4 guard.
    if (normalised.startsWith("::ffff:") || normalised.startsWith("64:ff9b:")) {
      const embedded = embeddedIpv4(normalised);
      // If we recovered an internal IPv4, reject. If we could not classify the
      // tail at all, reject conservatively — these prefixes have no legitimate
      // use as a public webhook destination.
      if (!embedded || isPrivateIpv4(embedded)) return true;
    }

    return false;
  } catch {
    // Anything we cannot confidently parse as a public address is treated as
    // unsafe rather than allowed.
    return true;
  }
}

// NOTE: this validates the hostname *string*, not the IP that fetch() ultimately
// resolves to. A DNS-based SSRF (public-looking hostname that resolves to a
// private IP) is caught by `resolvedHostIsPublic` below, which must be called at
// delivery time in addition to this string check.
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

  // Reject IP literals in private / loopback / link-local ranges. Only run the
  // IPv6 guard on actual IPv6 literals (which contain a colon) — otherwise
  // ordinary domains such as "fcbarcelona.com" match the fc00::/7 prefix test
  // and are wrongly rejected.
  const looksLikeIpv6 = hostname.includes(":");
  if (isPrivateIpv4(hostname) || (looksLikeIpv6 && isPrivateIpv6(hostname))) {
    return false;
  }

  return true;
}

/**
 * Resolve `hostname` and confirm no A/AAAA record points at a private,
 * loopback, or link-local address. This is the DNS-based-SSRF guard that
 * `isSafeWebhookUrl` (a pure string check) cannot provide: an attacker can
 * register `https://public.example` that resolves to 169.254.169.254 or
 * 127.0.0.1. Call this immediately before connecting.
 *
 * A narrow TOCTOU window remains between this lookup and the socket connect
 * (a rebind could swap the record in between); fully closing it requires
 * pinning the connection to the vetted IP via a custom dispatcher.
 */
export async function resolvedHostIsPublic(hostname: string): Promise<boolean> {
  // Strip brackets from IPv6 literals; a literal is already fully covered by
  // the string guard, so there is nothing to resolve.
  const host = hostname.replace(/^\[/, "").replace(/\]$/, "");
  if (isPrivateIpv4(host) || (host.includes(":") && isPrivateIpv6(host))) {
    return false;
  }

  const { lookup } = await import("node:dns/promises");
  let addresses: { address: string; family: number }[];
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    // Unresolvable host cannot be a valid public destination.
    return false;
  }
  if (addresses.length === 0) return false;

  for (const { address, family } of addresses) {
    if (family === 4 && isPrivateIpv4(address)) return false;
    if (family === 6 && isPrivateIpv6(address.toLowerCase())) return false;
  }
  return true;
}
