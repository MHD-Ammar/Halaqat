/**
 * Next.js Middleware
 *
 * Combined locale detection and route protection.
 * - Handles locale routing with next-intl
 * - Protected routes: /overview, /my-circle, /circles, /students, /profile
 * - Public routes: /, /login, /register
 * - Logged-in users on / or auth routes → redirect to /overview
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

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
  "/admin",
];

// Auth routes (login/register)
const authRoutes = ["/login", "/register", "/student-login"];

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

  // Check if this is a public key route (e.g., /ramadan)
  const isPublicKey = (path: string) => {
    return (
      path === "/login" ||
      path === "/register" ||
      path === "/forgot-password" ||
      path.startsWith("/ramadan")
    );
  };

  // Protected route without token → redirect to login
  if (isProtectedRoute && !token && !isPublicKey(pathnameWithoutLocale)) {
    const loginUrl = new URL(`/${currentLocale}/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let userRole: string | null = null;
  if (token) {
    try {
      const tokenParts = token.split(".");
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1] as string));
        userRole = payload.role;
      }
    } catch {
      // If decode fails, ignore
    }
  }

  // Logged-in user on auth routes → redirect based on role from token
  if (isAuthRoute && token) {
    if (userRole === "STUDENT") {
      return NextResponse.redirect(
        new URL(`/${currentLocale}/student-portal`, request.url),
      );
    }
    return NextResponse.redirect(
      new URL(`/${currentLocale}/overview`, request.url),
    );
  }

  // Role-Based Route Hardening for Protected Routes
  if (isProtectedRoute && token) {
    if (userRole === "STUDENT") {
      // Students can only access student-portal
      if (!pathnameWithoutLocale.startsWith("/student-portal")) {
        return NextResponse.redirect(
          new URL(`/${currentLocale}/student-portal`, request.url),
        );
      }
    } else {
      // Non-students
      if (pathnameWithoutLocale.startsWith("/student-portal")) {
        return NextResponse.redirect(
          new URL(`/${currentLocale}/overview`, request.url),
        );
      }
      
      // Only Admin and Supervisor can access /admin routes
      if (pathnameWithoutLocale.startsWith("/admin")) {
        if (userRole !== "ADMIN" && userRole !== "SUPERVISOR") {
          return NextResponse.redirect(
            new URL(`/${currentLocale}/overview`, request.url),
          );
        }
      }
    }
  }

  // Logged-in user on landing page (root) → redirect appropriately
  if (pathnameWithoutLocale === "/" && token) {
    if (userRole === "STUDENT") {
      return NextResponse.redirect(
        new URL(`/${currentLocale}/student-portal`, request.url),
      );
    }
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
