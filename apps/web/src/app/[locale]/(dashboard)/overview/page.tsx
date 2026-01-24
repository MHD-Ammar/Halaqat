"use client";

import { useAuth } from "@/hooks";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { TeacherDashboard } from "@/components/dashboards/teacher-dashboard";
import { ExaminerDashboard } from "@/components/dashboards/examiner-dashboard";
import { useTranslations } from "next-intl";

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
    case "ADMIN":
    case "SUPERVISOR":
      return <AdminDashboard />;
    case "TEACHER":
      return <TeacherDashboard />;
    case "EXAMINER":
      return <ExaminerDashboard />;
    default:
      return (
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-destructive">Access Denied: Unknown Role</p>
        </div>
      );
  }
}
