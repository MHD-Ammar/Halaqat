"use client";

/**
 * useAuth Hook
 *
 * Provides authentication utilities including logout and current user info.
 */

import { UserRole } from "@halaqat/types";
import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { TOKEN_COOKIE_NAME } from "@/lib/api";
import { routes } from "@/lib/constants/routes";

import { useUserProfile } from "./use-user-profile";

export { UserRole };

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mosqueId?: string;
}

/**
 * Hook for auth operations and current user
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError } = useUserProfile();

  /**
   * Logout - clears token, cache, and redirects
   */
  const logout = useCallback(() => {
    // Remove the auth token cookie
    Cookies.remove(TOKEN_COOKIE_NAME);

    // Clear all cached queries
    queryClient.clear();

    // Redirect to appropriate login page
    const isStudentUser = profile?.role === UserRole.STUDENT;
    router.push(isStudentUser ? routes.studentLogin() : routes.login());
    router.refresh();
  }, [queryClient, router, profile?.role]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!profile?.role) return false;
      if (Array.isArray(role)) {
        return role.includes(profile.role as UserRole);
      }
      return profile.role === role;
    },
    [profile?.role],
  );

  /**
   * Check if user is Admin or Supervisor
   */
  const isAdmin =
    profile?.role === UserRole.ADMIN || profile?.role === UserRole.SUPERVISOR;

  /**
   * Check if user is Teacher
   */
  const isTeacher = profile?.role === UserRole.TEACHER;

  /**
   * Check if user is Student
   */
  const isStudent = profile?.role === UserRole.STUDENT;

  return {
    user: profile as AuthUser | undefined,
    isLoading,
    isError,
    isAuthenticated: !!profile && !isError,
    isAdmin,
    isTeacher,
    isStudent,
    hasRole,
    logout,
  };
}
