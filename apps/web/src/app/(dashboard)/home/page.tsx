"use client";

/**
 * Dashboard Home Page
 *
 * Role-based redirect:
 * - Admin/Supervisor → /overview
 * - Teacher → /my-circle
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Role-based redirect
    if (user.role === "ADMIN" || user.role === "SUPERVISOR") {
      router.replace("/overview");
    } else {
      // Teachers go to their circle view
      router.replace("/my-circle");
    }
  }, [user, isLoading, router]);

  // Loading state while determining redirect
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
          <span className="text-primary-foreground font-bold text-2xl">ح</span>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 mx-auto" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    </div>
  );
}
