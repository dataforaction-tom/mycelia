/**
 * Slugs that collide with top-level application routes and so cannot be used
 * as an organisation slug. Org dashboards live at /[orgSlug], but a static
 * route (e.g. /admin, /pricing) wins over the dynamic segment — an org with a
 * colliding slug would be unreachable and its owner routed into the wrong
 * page. Reserve these at creation and rename time.
 */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "sign-in",
  "sign-out",
  "new-org",
  "pricing",
  "privacy",
  "terms",
  "favicon",
  "robots",
  "sitemap",
  "manifest",
  "opengraph-image",
  "twitter-image",
  "icon",
  "apple-icon",
  "llms",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}
