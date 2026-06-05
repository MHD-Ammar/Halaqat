"use client";

import { UserRole } from "@halaqat/types";
import { useTranslations } from "next-intl";

import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { ExaminerDashboard } from "@/components/dashboards/examiner-dashboard";
import { TeacherDashboard } from "@/components/dashboards/teacher-dashboard";
import { useAuth } from "@/hooks";


export default function OverviewPage() {
  const { user, isLoading } = useAuth();
  const t = useTranslations("Common");

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  switch (user.role) {
    case UserRole.ADMIN:
    case UserRole.SUPERVISOR:
      return <AdminDashboard />;
    case UserRole.TEACHER:
      return <TeacherDashboard />;
    case UserRole.EXAMINER:
      return <ExaminerDashboard />;
    default:
      return (
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-destructive">Access Denied: Unknown Role</p>
        </div>
      );
  }
}
