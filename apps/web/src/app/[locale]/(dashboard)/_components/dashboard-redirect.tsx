"use client";

import { useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks";
import { useRouter } from "@/i18n/routing";

/** Role to home path mapping */
const ROLE_HOME_PATHS: Record<string, string> = {
  ADMIN: "/overview",
  SUPERVISOR: "/overview",
  TEACHER: "/my-circle",
  EXAMINER: "/exams",
  STUDENT: "/student-portal",
};

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (user?.role) {
      const homePath = ROLE_HOME_PATHS[user.role] || "/overview";
      router.replace(homePath);
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
          <span className="text-primary-foreground font-bold text-2xl">ح</span>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </div>
      </div>
    </div>
  );
}
