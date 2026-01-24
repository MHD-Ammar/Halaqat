"use client";

/**
 * Role-Based Redirect Component
 *
 * Redirects users to their role-specific dashboard home page.
 * - ADMIN -> /overview
 * - TEACHER -> /my-circle
 * - EXAMINER -> /exams
 * - STUDENT -> /student-portal
 */

import { useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useAuth } from "@/hooks";

/** Role to home path mapping */
const ROLE_HOME_PATHS: Record<string, string> = {
  ADMIN: "/overview",
  SUPERVISOR: "/overview",
  TEACHER: "/my-circle",
  EXAMINER: "/exams",
  STUDENT: "/student-portal",
};

/**
 * Hook to get the home path for a given role
 */
export function getHomePathForRole(role?: string): string {
  if (!role) return "/overview"; // Default fallback
  return ROLE_HOME_PATHS[role] || "/overview";
}

/**
 * RoleRedirect component - renders nothing, just handles redirect logic
 * Use this in pages that should redirect based on role
 */
export function RoleRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Wait until auth is loaded
    if (isLoading || !user) return;

    // Get the correct home path for this role
    const homePath = getHomePathForRole(user.role);

    // Only redirect if we're on the root dashboard path
    // (This prevents redirect loops)
    if (pathname === "/" || pathname === "") {
      router.replace(homePath);
    }
  }, [user, isLoading, router, pathname]);

  return null;
}

export default RoleRedirect;
