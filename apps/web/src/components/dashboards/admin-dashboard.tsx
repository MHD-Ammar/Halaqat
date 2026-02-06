"use client";

import {
  Users,
  Percent,
  Star,
  Activity,
  Ticket,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

import { CreateUserDialog } from "@/components/create-user-dialog";
import { StatsCard } from "@/components/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminStats, useTeacherPerformance, useUserProfile } from "@/hooks";
import { useToast } from "@/hooks/use-toast";

/**
 * Format date for display
 */
function formatDate(dateString: string | null, locale: string): string {
  if (!dateString) return locale === "ar" ? "أبداً" : "Never";
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Calculate days ago from date
 */
function daysAgo(dateString: string | null): number {
  if (!dateString) return Infinity;
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function AdminDashboard() {
  const { data: profile } = useUserProfile();
  const t = useTranslations("Dashboard");
  const tMosque = useTranslations("Mosque");
  const locale = useLocale();
  const { toast } = useToast();

  const { data: adminStats, isLoading: statsLoading } = useAdminStats({
    enabled: true,
  });

  const { data: teachers = [], isLoading: teachersLoading } =
    useTeacherPerformance({
      enabled: true,
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("dashboardOverview")}
        </h1>
        <p className="text-muted-foreground">{t("adminDescription")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title={t("totalStudents")}
          value={adminStats?.totalStudents ?? 0}
          icon={Users}
          iconColor="text-blue-500"
          isLoading={statsLoading}
        />
        <StatsCard
          title={t("attendanceRate")}
          value={`${adminStats?.attendanceRate ?? 0}%`}
          icon={Percent}
          iconColor="text-green-500"
          isLoading={statsLoading}
        />
        <StatsCard
          title={t("pointsToday")}
          value={adminStats?.pointsAwardedToday ?? 0}
          icon={Star}
          iconColor="text-yellow-500"
          isLoading={statsLoading}
        />
        <StatsCard
          title={t("activeCircles")}
          value={adminStats?.activeCircles ?? 0}
          icon={Activity}
          iconColor="text-purple-500"
          isLoading={statsLoading}
        />
      </div>

      {/* Invite Code Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {tMosque("inviteCode")}
                </p>
                <p className="text-2xl font-bold font-mono tracking-wider text-primary">
                  {profile?.mosque?.code || "..."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                const code = profile?.mosque?.code;
                if (code) {
                  navigator.clipboard.writeText(code);
                  toast({
                    title: tMosque("copied"),
                    description: tMosque("copiedDescription"),
                  });
                }
              }}
            >
              <Copy className="h-4 w-4" />
              {tMosque("copy")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("teacherPerformance")}
          </CardTitle>
          <CreateUserDialog />
        </CardHeader>
        <CardContent>
          {teachersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("noTeachers")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("teacher")}</TableHead>
                    <TableHead>{t("circle")}</TableHead>
                    <TableHead className="text-center">
                      {t("myStudents")}
                    </TableHead>
                    <TableHead>{t("lastSession")}</TableHead>
                    <TableHead className="text-center">{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => {
                    const days = daysAgo(teacher.lastSessionDate);
                    const isInactive = days > 3;

                    return (
                      <TableRow
                        key={teacher.teacherId}
                        className={
                          isInactive ? "bg-red-50 dark:bg-red-950/20" : ""
                        }
                      >
                        <TableCell className="font-medium">
                          {teacher.teacherName}
                        </TableCell>
                        <TableCell>{teacher.circleName}</TableCell>
                        <TableCell className="text-center">
                          {teacher.studentCount}
                        </TableCell>
                        <TableCell>
                          <span className={isInactive ? "text-red-600" : ""}>
                            {formatDate(teacher.lastSessionDate, locale)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {isInactive ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {t("inactive")}
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700"
                            >
                              {t("active")}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
