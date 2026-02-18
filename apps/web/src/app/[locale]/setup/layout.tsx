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

import { Logo } from "@/components/logo";
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
          <div className="flex justify-center mx-auto">
            <Logo width={48} height={48} />
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
          <div className="flex justify-center mx-auto mb-4">
            <Logo width={64} height={64} />
          </div>
        </div>

        {/* Main content */}
        {children}
      </div>
    </div>
  );
}
