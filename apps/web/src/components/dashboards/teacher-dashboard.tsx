"use client";

/**
 * TeacherDashboard Component
 *
 * Comprehensive dashboard for teachers with date range filtering,
 * attendance trends, top students, and recent sessions.
 */

import { format, subDays } from "date-fns";
import {
  Users,
  Calendar,
  TrendingUp,
  BookOpen,
  Star,
  FileText,
  UserCheck,
  UserX,
  Trophy,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { type DateRange } from "react-day-picker";

import { CircleSessionSummaryButton } from "@/components/dashboards/circle-session-summary-button";
import { StatsCard } from "@/components/stats-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useTeacherDashboard } from "@/hooks/use-teacher-dashboard";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Link } from "@/i18n/routing";

/**
 * Format date to YYYY-MM-DD for the API
 */
function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Attendance trend bar for a single day
 */
function AttendanceBar({
  present,
  absent,
  late,
  total,
  date,
  t,
}: {
  present: number;
  absent: number;
  late: number;
  total: number;
  date: string;
  t: ReturnType<typeof useTranslations>;
}) {
  if (total === 0) return null;
  const presentPct = (present / total) * 100;
  const latePct = (late / total) * 100;
  const absentPct = (absent / total) * 100;

  // Format date for display (e.g. "02/15")
  const displayDate = date.slice(5).replace("-", "/");

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-[32px]">
      <div
        className="w-full rounded-md overflow-hidden flex flex-col-reverse"
        style={{ height: "80px" }}
        title={`${t("present")}: ${present}, ${t("late")}: ${late}, ${t("absent")}: ${absent}`}
      >
        <div
          className="bg-emerald-500 transition-all"
          style={{ height: `${presentPct}%` }}
        />
        <div
          className="bg-amber-400 transition-all"
          style={{ height: `${latePct}%` }}
        />
        <div
          className="bg-red-400 transition-all"
          style={{ height: `${absentPct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground leading-none">
        {displayDate}
      </span>
    </div>
  );
}

export function TeacherDashboard() {
  const t = useTranslations("TeacherDashboard");

  // Get user profile to find their circle
  const { data: profile } = useUserProfile();
  const circleId = profile?.circles?.[0]?.id;
  const circleName = profile?.circles?.[0]?.name;

  // Default date range: last 7 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { from: subDays(today, 6), to: today };
  });

  const fromStr = useMemo(
    () => (dateRange?.from ? toDateString(dateRange.from) : ""),
    [dateRange?.from],
  );
  const toStr = useMemo(
    () => (dateRange?.to ? toDateString(dateRange.to) : ""),
    [dateRange?.to],
  );

  const { data, isLoading } = useTeacherDashboard(fromStr, toStr);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ms-3 text-muted-foreground">{t("loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Quick Actions */}
      {circleId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/overview/challenges" className="block group">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent hover:from-amber-500/20 hover:via-orange-500/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{t("challengesDashboard")}</p>
                  <p className="text-xs text-muted-foreground truncate">{t("challengesDesc")}</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {circleName && (
            <CircleSessionSummaryButton
              circleId={circleId}
              circleName={circleName}
            />
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatsCard
          title={t("totalStudents")}
          value={data?.totalStudents ?? 0}
          icon={Users}
          isLoading={isLoading}
        />
        <StatsCard
          title={t("totalSessions")}
          value={data?.totalSessions ?? 0}
          icon={Calendar}
          isLoading={isLoading}
        />
        <StatsCard
          title={t("averageAttendance")}
          value={`${data?.averageAttendanceRate ?? 0}%`}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatsCard
          title={t("totalRecitations")}
          value={data?.totalRecitations ?? 0}
          icon={BookOpen}
          isLoading={isLoading}
        />
        <StatsCard
          title={t("pagesRecited")}
          value={data?.totalPagesRecited ?? 0}
          icon={FileText}
          isLoading={isLoading}
        />
        <StatsCard
          title={t("pointsAwarded")}
          value={data?.totalPointsAwarded ?? 0}
          icon={Star}
          isLoading={isLoading}
        />
      </div>

      {/* Attendance Trend + Top Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Trend Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              {t("attendanceTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.attendanceTrend && data.attendanceTrend.length > 0 ? (
              <>
                <div className="flex gap-1 items-end w-full">
                  {data.attendanceTrend.map((day) => (
                    <AttendanceBar
                      key={day.date}
                      present={day.present}
                      absent={day.absent}
                      late={day.late}
                      total={day.total}
                      date={day.date}
                      t={t}
                    />
                  ))}
                </div>
                {/* Legend */}
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                    {t("present")}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                    {t("late")}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-sm bg-red-400" />
                    {t("absent")}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {t("noData")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              {t("topStudents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topStudents && data.topStudents.length > 0 ? (
              <div className="space-y-0">
                {/* Table Header */}
                <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <span>{t("studentName")}</span>
                  <span className="text-center">{t("points")}</span>
                  <span className="text-center">{t("pages")}</span>
                  <span className="text-center">{t("attendance")}</span>
                </div>
                {/* Rows */}
                {data.topStudents.map((student, i) => (
                  <div
                    key={student.studentId}
                    className="grid grid-cols-4 gap-2 py-2.5 text-sm items-center border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="truncate font-medium">
                        {student.studentName}
                      </span>
                    </div>
                    <span className="text-center font-semibold text-primary">
                      {student.totalPoints}
                    </span>
                    <span className="text-center">
                      {student.totalPages}
                    </span>
                    <span className="text-center">
                      {student.attendanceRate}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {t("noStudents")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {t("recentSessions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentSessions && data.recentSessions.length > 0 ? (
            <div className="space-y-0">
              {data.recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{session.date}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1" title={t("present")}>
                      <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{session.presentCount}</span>
                    </div>
                    <div className="flex items-center gap-1" title={t("absent")}>
                      <UserX className="h-3.5 w-3.5 text-red-400" />
                      <span>{session.absentCount}</span>
                    </div>
                    <div className="flex items-center gap-1" title={t("totalRecitations")}>
                      <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                      <span>{session.recitationCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {t("noSessions")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
