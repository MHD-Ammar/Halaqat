"use client";

/**
 * Dashboard Layout
 *
 * Responsive layout with:
 * - Mobile: Header + Bottom Navigation
 * - Desktop: Sidebar Navigation
 * - Auth protection: Redirects to /login if no token
 */

import { ReactNode, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { TOKEN_COOKIE_NAME } from "@/lib/api";
import { MainNav } from "@/components/main-nav";
import { MobileHeader } from "@/components/mobile-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/routing";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const token = Cookies.get(TOKEN_COOKIE_NAME);

    if (!token) {
      // No token, redirect to login
      router.replace("/login");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  // Show loading while checking auth
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
        <div className="min-h-screen pb-20 md:pb-0">{children}</div>
      </main>
    </div>
  );
}
