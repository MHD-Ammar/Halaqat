"use client";

/**
 * Student Profile Page
 *
 * Comprehensive student profile with stats and tabbed content.
 */

import {
  ArrowLeft,
  Star,
  Percent,
  BookOpen,
  Calendar,
  Award,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { PointsItem } from "@/components/points-item";
import { RecitationItem } from "@/components/recitation-item";
import { StatsCard } from "@/components/stats-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudentProfile } from "@/hooks";

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const t = useTranslations("Students");
  const tCommon = useTranslations("Common");
  const tDash = useTranslations("Dashboard");
  const tMyCircle = useTranslations("MyCircle");
  const tStudentProfile = useTranslations("StudentProfile");

  const { data: profile, isLoading, error } = useStudentProfile(studentId);

  /**
   * Format attendance status with color and translation
   */
  function getStatusBadge(status: string) {
    const config: Record<string, { label: string; className: string }> = {
      PRESENT: {
        label: tMyCircle("present"),
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      },
      ABSENT: {
        label: tMyCircle("absent"),
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      },
      LATE: {
        label: tMyCircle("late"),
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      EXCUSED: {
        label: tMyCircle("excused"),
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      },
    };
    const info = config[status] || { label: status, className: "bg-gray-100" };
    return (
      <Badge variant="outline" className={info.className}>
        {info.label}
      </Badge>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-4 md:p-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
          {tCommon("back")}
        </Button>
        <div className="text-center py-12 text-muted-foreground font-medium">
          {t("failedToLoadProfile")}
        </div>
      </div>
    );
  }

  const { student, stats, recentActivity, pointsHistory, attendanceHistory } =
    profile;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="hover:bg-transparent -ms-4"
      >
        <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
        {tCommon("back")}
      </Button>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 bg-card p-6 rounded-xl border">
        <Avatar className="h-24 w-24 text-3xl border-2 border-primary/20">
          <AvatarFallback className="bg-primary/5 text-primary font-bold">
            {getInitials(student.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-black tracking-tight">{student.name}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-semibold px-2.5 py-0.5">
              {student.circle?.name || t("noCircle")}
            </Badge>
          </div>
        </div>
        <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
          <Badge
            variant="secondary"
            className="text-xl px-5 py-2.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 hover:bg-yellow-200"
          >
            <Star className="h-5 w-5 me-1.5 fill-current" />
            <span className="font-black">{stats.totalPoints}</span>
            <span className="ms-1.5 text-xs uppercase font-bold opacity-70">
              {tCommon("points")}
            </span>
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title={tDash("attendanceRate")}
          value={`${stats.attendanceRate}%`}
          icon={Percent}
          iconColor="text-emerald-500"
        />
        <StatsCard
          title={t("totalRecitations")}
          value={stats.totalRecitations}
          icon={BookOpen}
          iconColor="text-sky-500"
        />
        <StatsCard
          title={tDash("totalStudents")}
          value={stats.totalPoints}
          icon={Award}
          iconColor="text-amber-500"
        />
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="w-full flex md:grid md:grid-cols-4 min-w-[400px]">
            <TabsTrigger value="overview" className="flex-1">
              {tStudentProfile("overview")}
            </TabsTrigger>
            <TabsTrigger value="recitations" className="flex-1">
              {tStudentProfile("recitations")}
            </TabsTrigger>
            <TabsTrigger value="points" className="flex-1">
              {tStudentProfile("points")}
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex-1">
              {tStudentProfile("attendance")}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card className="overflow-hidden border-none shadow-sm bg-muted/30">
            <CardHeader className="bg-muted/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest font-black text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                {t("recentActivity")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 pt-6">
              {recentActivity.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center gap-3">
                  <div className="p-4 bg-muted rounded-full">
                    <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    {tStudentProfile("noRecitations")}
                  </p>
                </div>
              ) : (
                recentActivity
                  .slice(0, 5)
                  .map((rec) => (
                    <RecitationItem
                      key={rec.id}
                      pageNumber={rec.pageNumber}
                      surahName={rec.surahName}
                      surahNameArabic={rec.surahNameArabic}
                      quality={rec.quality}
                      type={rec.type}
                      createdAt={rec.createdAt}
                    />
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recitations Tab */}
        <TabsContent value="recitations" className="space-y-3 mt-6">
          {recentActivity.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center text-muted-foreground font-medium flex flex-col items-center gap-3">
                <BookOpen className="h-10 w-10 opacity-20" />
                {tStudentProfile("noRecitations")}
              </CardContent>
            </Card>
          ) : (
            recentActivity.map((rec) => (
              <RecitationItem
                key={rec.id}
                pageNumber={rec.pageNumber}
                surahName={rec.surahName}
                surahNameArabic={rec.surahNameArabic}
                quality={rec.quality}
                type={rec.type}
                createdAt={rec.createdAt}
              />
            ))
          )}
        </TabsContent>

        {/* Points Tab */}
        <TabsContent value="points" className="space-y-3 mt-6">
          {pointsHistory.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center text-muted-foreground font-medium flex flex-col items-center gap-3">
                <Award className="h-10 w-10 opacity-20" />
                {tStudentProfile("noPoints")}
              </CardContent>
            </Card>
          ) : (
            pointsHistory.map((pt) => (
              <PointsItem
                key={pt.id}
                amount={pt.amount}
                reason={pt.reason}
                createdAt={pt.createdAt}
              />
            ))
          )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-3 mt-6">
          {attendanceHistory.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center text-muted-foreground font-medium flex flex-col items-center gap-3">
                <Calendar className="h-10 w-10 opacity-20" />
                {tStudentProfile("noAttendance")}
              </CardContent>
            </Card>
          ) : (
            attendanceHistory.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-4 bg-card rounded-xl border hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                    <Calendar className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">
                      {new Date(att.sessionDate).toLocaleDateString(
                        params.locale === "ar" ? "ar-EG" : "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </span>
                    <span className="text-[10px] uppercase font-black tracking-tighter text-muted-foreground/60">
                      {tMyCircle("todaySession")}
                    </span>
                  </div>
                </div>
                {getStatusBadge(att.status)}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
