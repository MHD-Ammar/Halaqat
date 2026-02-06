"use client";

/**
 * Dashboard Layout
 *
 * Responsive layout with:
 * - Mobile: Header + Bottom Navigation
 * - Desktop: Sidebar Navigation
 * - Auth protection: Redirects to /login if no token
 * - First-run detection: Teachers with no circles go to /setup/welcome
 */

import Cookies from "js-cookie";
import { ReactNode, useEffect, useState } from "react";

import { MainNav } from "@/components/main-nav";
import { MobileHeader } from "@/components/mobile-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, useMyCircles } from "@/hooks";
import { useRouter } from "@/i18n/routing";
import { TOKEN_COOKIE_NAME } from "@/lib/api";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const token = Cookies.get(TOKEN_COOKIE_NAME);

    if (!token) {
      // No token, redirect to login
      router.replace("/login");
    } else {
      setHasToken(true);
    }
  }, [router]);

  // Only fetch user profile and circles when we have a token
  const { user, isLoading: isAuthLoading, isError: isAuthError } = useAuth();
  const {
    data: circles,
    isLoading: isCirclesLoading,
    isFetched: isCirclesFetched,
  } = useMyCircles({
    enabled: hasToken, // Only fetch when token is confirmed
  });

  // First-run detection: Check if teacher has no circles
  useEffect(() => {
    // Wait until we have a token
    if (!hasToken) return;

    // Wait for auth to complete
    if (isAuthLoading) return;

    // If auth failed, don't proceed (will show error or redirect)
    if (isAuthError || !user) return;

    // For teachers, wait for circles to be fetched before deciding
    if (user.role === "TEACHER") {
      // Wait for circles query to complete
      if (isCirclesLoading || !isCirclesFetched) return;

      // If teacher has no circles, redirect to setup wizard
      if (!circles || circles.length === 0) {
        router.replace("/setup/welcome");
        return;
      }
    }

    // All checks passed - allow rendering
    setIsChecking(false);
  }, [
    hasToken,
    user,
    circles,
    isAuthLoading,
    isAuthError,
    isCirclesLoading,
    isCirclesFetched,
    router,
  ]);

  // Show loading while checking auth and first-run status
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-2xl">
              ح
            </span>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Navigation (Sidebar on desktop, Bottom nav on mobile) */}
      <MainNav />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content Area */}
      <main className="md:ps-64">
        <div className="min-h-screen pb-20 md:pb-0 p-4">{children}</div>
      </main>
    </div>
  );
}

