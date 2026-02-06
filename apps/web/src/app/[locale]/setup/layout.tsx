"use client";

/**
 * Setup Wizard Layout
 *
 * Distraction-free layout for first-run setup:
 * - No sidebar
 * - No mobile header
 * - Centered card design with logo
 */

import Cookies from "js-cookie";
import { ReactNode, useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/routing";
import { TOKEN_COOKIE_NAME } from "@/lib/api";

export default function SetupLayout({ children }: { children: ReactNode }) {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      {/* Centered content container */}
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-primary-foreground font-bold text-3xl">
              ح
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">حلقات</h1>
        </div>

        {/* Main content */}
        {children}
      </div>
    </div>
  );
}
