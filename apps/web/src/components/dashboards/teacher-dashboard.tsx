"use client";

import {
  Users,
  Percent,
  Star,
  Activity,
  UserPlus,
  ChevronRight,
  PlayCircle,
  Clock,
  CalendarCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatsCard } from "@/components/stats-card";
import { CreateStudentDialog } from "@/components/create-student-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useTeacherStats,
  useCircle,
  useUserProfile,
  useTodaySession,
  useStartSession,
} from "@/hooks";
import { useState } from "react";
import { DailySummaryModal } from "../daily-summary-modal";

/**
 * Get initials from name
 */
function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TeacherDashboard() {
  const { data: profile } = useUserProfile();
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");
  const tSession = useTranslations("DailySession");
  const { toast } = useToast();
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Get teacher's first circle ID
  const teacherCircleId = profile?.circles?.[0]?.id;

  const { data: stats, isLoading: statsLoading } = useTeacherStats({
    enabled: true,
  });

  const { data: circleDetails, isLoading: circleLoading } = useCircle(
    teacherCircleId || undefined,
    { enabled: !!teacherCircleId },
  );

  const { data: session, isLoading: sessionLoading } =
    useTodaySession(teacherCircleId);

  const startSessionMutation = useStartSession();

  const handleStartSession = async () => {
    if (!teacherCircleId) return;

    try {
      await startSessionMutation.mutateAsync(teacherCircleId);
      toast({
        title: tSession("sessionStarted"),
        description: tSession("sessionStartedDesc"),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: "Failed to start session",
      });
    }
  };

  const students = circleDetails?.students || [];

  return (
    <div className="space-y-6">
      {/* Header with Summary Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("myPerformance")}
          </h1>
          <p className="text-muted-foreground">{t("teacherDescription")}</p>
        </div>

        {/* Only show Summary button if session exists */}
        {session && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSummaryOpen(true)}
              className="gap-2"
            >
              <CalendarCheck className="h-4 w-4" />
              {tSession("showSummary")}
            </Button>
            <DailySummaryModal
              open={summaryOpen}
              onOpenChange={setSummaryOpen}
              circleName={circleDetails?.name}
              students={students}
              attendances={session.attendances}
              recitations={session.recitations}
              pointTransactions={session.pointTransactions}
              sessionDate={session.date}
            />
          </div>
        )}
      </div>

      {/* Session Status Card */}
      {teacherCircleId && !sessionLoading && !session && (
        <Card className="bg-primary/5 border-primary/20 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Clock className="h-5 w-5" />
              {tSession("title")}
            </CardTitle>
            <CardDescription>{tSession("startSessionDesc")}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={handleStartSession}
              disabled={startSessionMutation.isPending}
              className="w-full sm:w-auto gap-2"
            >
              {startSessionMutation.isPending ? (
                tCommon("loading")
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  {tSession("startAction")}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title={t("myStudents")}
          value={stats?.totalStudents ?? 0}
          icon={Users}
          iconColor="text-blue-500"
          isLoading={statsLoading}
        />
        <StatsCard
          title={t("attendanceRate")}
          value={`${stats?.attendanceRate ?? 0}%`}
          icon={Percent}
          iconColor="text-green-500"
          isLoading={statsLoading}
        />
        <StatsCard
          title={t("pointsToday")}
          value={stats?.pointsAwardedToday ?? 0}
          icon={Star}
          iconColor="text-yellow-500"
          isLoading={statsLoading}
        />
        <StatsCard
          title={t("myCircles")}
          value={profile?.circles?.length ?? 0}
          icon={Activity}
          iconColor="text-purple-500"
          isLoading={statsLoading}
        />
      </div>

      {/* Students List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("myStudents")}
          </CardTitle>
          {teacherCircleId && (
            <CreateStudentDialog defaultCircleId={teacherCircleId}>
              <button className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <UserPlus className="h-4 w-4" />
                {t("addStudent")}
              </button>
            </CreateStudentDialog>
          )}
        </CardHeader>
        <CardContent>
          {circleLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t("noStudents")}</p>
              {teacherCircleId && (
                <CreateStudentDialog defaultCircleId={teacherCircleId}>
                  <button className="mt-3 text-primary hover:underline text-sm">
                    {t("addFirstStudent")}
                  </button>
                </CreateStudentDialog>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <Link
                  key={student.id}
                  href={`/students/${student.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.totalPoints ?? 0} {tCommon("points")}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
