/**
 * Parse `?limit`/`?offset` with defaults 50/0. `limit` is clamped to 1..100
 * and `offset` to >= 0; non-numeric values fall back to the defaults.
 *
 * Shared by the `/api/v1` read routes so pagination behaves identically across
 * connections, moments, observations, and spaces.
 */
export function parsePagination(request: Request): {
  limit: number;
  offset: number;
} {
  const params = new URL(request.url).searchParams;

  // Guard the null case explicitly: an omitted param is `null`, and
  // `Number(null)` is 0 — which would clamp the default limit down to 1 and
  // silently shrink every default list request. Fall back to the default.
  const limitParam = params.get("limit");
  const rawLimit = limitParam === null ? NaN : Number(limitParam);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(100, Math.max(1, Math.trunc(rawLimit)))
    : 50;

  const offsetParam = params.get("offset");
  const rawOffset = offsetParam === null ? NaN : Number(offsetParam);
  const offset = Number.isFinite(rawOffset)
    ? Math.max(0, Math.trunc(rawOffset))
    : 0;

  return { limit, offset };
}
