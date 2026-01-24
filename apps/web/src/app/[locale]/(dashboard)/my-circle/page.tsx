"use client";

/**
 * Dashboard Page - Today's Session
 *
 * The teacher's main view showing today's session with attendance management.
 */

import { useState, useMemo, useCallback } from "react";
import { Link } from "@/i18n/routing";
import {
  Check,
  X,
  Clock,
  AlertCircle,
  Save,
  RefreshCw,
  Users,
  PlayCircle,
} from "lucide-react";
import { AttendanceStatus } from "@halaqat/types";
import { useTranslations, useFormatter } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useTodaySession,
  useUpdateAttendance,
} from "@/hooks/use-today-session";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useStartSession } from "@/hooks";
import { StudentActionSheet } from "@/components/student-action-sheet";

/**
 * Status cycle order for toggling
 */
const STATUS_CYCLE: AttendanceStatus[] = [
  AttendanceStatus.PRESENT,
  AttendanceStatus.ABSENT,
  AttendanceStatus.LATE,
  AttendanceStatus.EXCUSED,
];

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

export default function DashboardPage() {
  const { toast } = useToast();
  const t = useTranslations("MyCircle");
  const tCommon = useTranslations("Common");
  const tSession = useTranslations("DailySession");
  const format = useFormatter();

  // Get user profile to find their circle
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  // For demo purposes, use first circle if available
  // In production, you might let the teacher select their circle
  const circleId = profile?.circles?.[0]?.id;

  // Fetch today's session
  const {
    data: session,
    isLoading: sessionLoading,
    isError,
    refetch,
  } = useTodaySession(circleId);

  // Mutation for saving attendance
  const updateMutation = useUpdateAttendance(session?.id);
  const startSessionMutation = useStartSession();

  const handleStartSession = async () => {
    if (!circleId) return;

    try {
      await startSessionMutation.mutateAsync(circleId);
      toast({
        title: tSession("sessionStarted"),
        description: tSession("sessionStartedDesc"),
      });
      // Force refetch session
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: "Failed to start session",
      });
    }
  };

  // Local state for tracking changes
  const [localChanges, setLocalChanges] = useState<
    Record<string, AttendanceStatus>
  >({});

  // Calculate if there are unsaved changes
  const hasChanges = useMemo(
    () => Object.keys(localChanges).length > 0,
    [localChanges],
  );

  /**
   * Status display configuration
   * Moved inside component to use translations
   */
  const getStatusConfig = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return {
          label: t("present"),
          color: "text-green-700",
          bgColor: "bg-green-100 hover:bg-green-200",
          icon: <Check className="w-4 h-4" />,
        };
      case AttendanceStatus.ABSENT:
        return {
          label: t("absent"),
          color: "text-red-700",
          bgColor: "bg-red-100 hover:bg-red-200",
          icon: <X className="w-4 h-4" />,
        };
      case AttendanceStatus.LATE:
        return {
          label: t("late"),
          color: "text-yellow-700",
          bgColor: "bg-yellow-100 hover:bg-yellow-200",
          icon: <Clock className="w-4 h-4" />,
        };
      case AttendanceStatus.EXCUSED:
      default:
        return {
          label: t("excused"),
          color: "text-gray-700",
          bgColor: "bg-gray-200 hover:bg-gray-300",
          icon: <AlertCircle className="w-4 h-4" />,
        };
    }
  };

  // Toggle attendance status for a student
  const toggleStatus = useCallback(
    (studentId: string, currentStatus: AttendanceStatus) => {
      const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
      const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
      const nextStatus = STATUS_CYCLE[nextIndex]!;

      // Find the original status from the session data
      const originalStatus = session?.attendances.find(
        (a) => a.studentId === studentId,
      )?.status;

      if (nextStatus === originalStatus) {
        // Remove from local changes if back to original
        setLocalChanges((prev) => {
          const newState = { ...prev };
          delete newState[studentId];
          return newState;
        });
      } else {
        setLocalChanges((prev) => ({
          ...prev,
          [studentId]: nextStatus,
        }));
      }
    },
    [session?.attendances],
  );

  // Get effective status (local change or original)
  const getEffectiveStatus = useCallback(
    (studentId: string, originalStatus: AttendanceStatus): AttendanceStatus => {
      return localChanges[studentId] ?? originalStatus;
    },
    [localChanges],
  );

  // Save changes
  const handleSave = useCallback(async () => {
    const updates = Object.entries(localChanges).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    try {
      await updateMutation.mutateAsync(updates);
      setLocalChanges({});
      toast({
        title: tCommon("success"),
        description: tCommon("success"),
      });
    } catch {
      toast({
        title: tCommon("error"),
        description: tCommon("error"),
        variant: "destructive",
      });
    }
  }, [localChanges, updateMutation, toast, tCommon]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!session?.attendances)
      return { total: 0, present: 0, absent: 0, late: 0 };

    const attendances = session.attendances.map((a) => ({
      ...a,
      status: getEffectiveStatus(a.studentId, a.status),
    }));

    return {
      total: attendances.length,
      present: attendances.filter((a) => a.status === AttendanceStatus.PRESENT)
        .length,
      absent: attendances.filter((a) => a.status === AttendanceStatus.ABSENT)
        .length,
      late: attendances.filter((a) => a.status === AttendanceStatus.LATE)
        .length,
    };
  }, [session?.attendances, getEffectiveStatus]);

  // Loading state
  if (profileLoading || sessionLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  // No circle assigned
  if (!circleId) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {t("noCircleAssigned")}
            </h2>
            <p className="text-muted-foreground">{t("noCircleAssignedDesc")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">{tCommon("error")}</h2>
            <p className="text-muted-foreground mb-4">{tCommon("error")}</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 me-2" />
              {tCommon("add")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {session
            ? format.dateTime(new Date(session.date), {
                weekday: "long",
                day: "numeric",
                month: "short",
              })
            : t("todaySession")}
        </h1>
        <p className="text-muted-foreground">{session?.circle?.name}</p>
      </div>

      {/* Start Session Card */}
      {!session && !sessionLoading && circleId && (
        <Card className="bg-primary/5 border-primary/20 border-dashed mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Clock className="h-5 w-5" />
              {tSession("title")}
            </CardTitle>
            <CardContent className="p-0 pt-2">
              <p className="text-muted-foreground">
                {tSession("startSessionDesc")}
              </p>
            </CardContent>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={handleStartSession}
              disabled={startSessionMutation.isPending}
              className="w-full sm:w-auto gap-2"
            >
              {startSessionMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {tCommon("loading")}
                </>
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

      {/* Stats Cards - Only show if session exists */}
      {session && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tCommon("name")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("present")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.present}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance List */}
      <div className="space-y-2">
        {session?.attendances.map((attendance) => {
          const effectiveStatus = getEffectiveStatus(
            attendance.studentId,
            attendance.status,
          );
          const config = getStatusConfig(effectiveStatus);
          const hasChange = localChanges[attendance.studentId] !== undefined;

          return (
            <StudentActionSheet
              key={attendance.id}
              student={attendance.student}
              sessionId={session.id}
              circleId={circleId}
            >
              <Card
                className={`transition-all cursor-pointer hover:shadow-md ${hasChange ? "ring-2 ring-primary" : ""}`}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar - Links to student profile */}
                    <Link
                      href={`/students/${attendance.student.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold hover:bg-primary/20 transition-colors">
                        {getInitials(attendance.student.name)}
                      </div>
                    </Link>
                    {/* Name - Links to student profile */}
                    <div className="min-w-0">
                      <Link
                        href={`/students/${attendance.student.id}`}
                        className="font-medium truncate hover:text-primary hover:underline block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {attendance.student.name}
                      </Link>
                    </div>
                  </div>

                  {/* Status Badge Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`min-w-[100px] h-11 ${config.bgColor} ${config.color}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(attendance.studentId, effectiveStatus);
                    }}
                  >
                    {config.icon}
                    <span className="ms-2">{config.label}</span>
                  </Button>
                </CardContent>
              </Card>
            </StudentActionSheet>
          );
        })}
      </div>

      {/* Empty state - Only if session exists but somehow no students, OR if no session but not circle error */}
      {session && session.attendances.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{tCommon("noData")}</p>
          </CardContent>
        </Card>
      )}

      {/* Floating Save Button */}
      {hasChanges && (
        <div className="fixed bottom-20 md:bottom-6 left-0 right-0 flex justify-center z-50 px-4">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="shadow-lg min-w-[200px]"
          >
            {updateMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 me-2 animate-spin" />
                {tCommon("saving")}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 me-2" />
                {t("saveChanges")} ({Object.keys(localChanges).length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
