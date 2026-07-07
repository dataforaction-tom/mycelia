import { auth } from "@/lib/auth";

// Marketing pages and metadata assets: crawlers and signed-out visitors
// must reach these — LinkedIn's bot follows no redirects.
const PUBLIC_PATHS = new Set([
  "/",
  "/pricing",
  "/privacy",
  "/terms",
  "/opengraph-image.png",
  "/twitter-image.png",
  "/icon",
  "/apple-icon",
  "/manifest.webmanifest",
  "/llms.txt",
]);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public pages, auth routes, API routes and static files
  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-out") ||
    pathname.startsWith("/new-org") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return;
  }

  // Protect dashboard routes: /[orgSlug]/*
  // These are any path that starts with a slug-like segment (not a known public route)
  const isOrgRoute = /^\/[a-z0-9][a-z0-9-]*/.test(pathname);

  if (isOrgRoute && !req.auth) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
