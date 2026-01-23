/**
 * Next.js Middleware
 *
 * Combined locale detection and route protection.
 * - Handles locale routing with next-intl
 * - Protected routes: /overview, /my-circle, /circles, /students, /profile
 * - Public routes: /, /login, /register
 * - Logged-in users on / or auth routes → redirect to /overview
 */

import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

// Routes that require authentication (without locale prefix)
const protectedRoutes = [
  "/overview",
  "/my-circle",
  "/circles",
  "/students",
  "/profile",
  "/student-portal",
  "/exams",
];

// Auth routes (login/register)
const authRoutes = ["/login", "/register"];

// Cookie name for auth token
const TOKEN_COOKIE_NAME = "token";

/**
 * Extract pathname without locale prefix
 */
function getPathnameWithoutLocale(pathname: string): string {
  const locales = ["ar", "en"];
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
    if (pathname === `/${locale}`) {
      return "/";
    }
  }
  return pathname;
}

/**
 * Get current locale from pathname
 */
function getLocaleFromPathname(pathname: string): string {
  const locales = ["ar", "en"];
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return "ar"; // default
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  // Get pathname without locale for route matching
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname);
  const currentLocale = getLocaleFromPathname(pathname);

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      pathnameWithoutLocale === route ||
      pathnameWithoutLocale.startsWith(route + "/"),
  );

  // Check if this is an auth route
  const isAuthRoute = authRoutes.some(
    (route) => pathnameWithoutLocale === route,
  );

  // Protected route without token → redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL(`/${currentLocale}/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged-in user on auth routes → redirect to overview
  if (isAuthRoute && token) {
    return NextResponse.redirect(
      new URL(`/${currentLocale}/overview`, request.url),
    );
  }

  // Logged-in user on landing page (root) → redirect to overview
  if (pathnameWithoutLocale === "/" && token) {
    return NextResponse.redirect(
      new URL(`/${currentLocale}/overview`, request.url),
    );
  }

  // Run the intl middleware for locale handling
  return intlMiddleware(request);
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
