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

  const rawLimit = Number(params.get("limit"));
  const limit = Number.isFinite(rawLimit)
    ? Math.min(100, Math.max(1, Math.trunc(rawLimit)))
    : 50;

  const rawOffset = Number(params.get("offset"));
  const offset = Number.isFinite(rawOffset)
    ? Math.max(0, Math.trunc(rawOffset))
    : 0;

  return { limit, offset };
}
