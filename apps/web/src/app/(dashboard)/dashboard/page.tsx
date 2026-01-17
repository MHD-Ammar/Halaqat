"use client";

/**
 * Dashboard Page - Today's Session
 *
 * The teacher's main view showing today's session with attendance management.
 */

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Check, X, Clock, AlertCircle, Save, RefreshCw, Users } from "lucide-react";
import { AttendanceStatus } from "@halaqat/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTodaySession, useUpdateAttendance } from "@/hooks/use-today-session";
import { useUserProfile } from "@/hooks/use-user-profile";
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
 * Status display configuration
 */
const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  [AttendanceStatus.PRESENT]: {
    label: "Present",
    color: "text-green-700",
    bgColor: "bg-green-100 hover:bg-green-200",
    icon: <Check className="w-4 h-4" />,
  },
  [AttendanceStatus.ABSENT]: {
    label: "Absent",
    color: "text-red-700",
    bgColor: "bg-red-100 hover:bg-red-200",
    icon: <X className="w-4 h-4" />,
  },
  [AttendanceStatus.LATE]: {
    label: "Late",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100 hover:bg-yellow-200",
    icon: <Clock className="w-4 h-4" />,
  },
  [AttendanceStatus.EXCUSED]: {
    label: "Excused",
    color: "text-gray-700",
    bgColor: "bg-gray-200 hover:bg-gray-300",
    icon: <AlertCircle className="w-4 h-4" />,
  },
};

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

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

  // Local state for tracking changes
  const [localChanges, setLocalChanges] = useState<
    Record<string, AttendanceStatus>
  >({});

  // Calculate if there are unsaved changes
  const hasChanges = useMemo(
    () => Object.keys(localChanges).length > 0,
    [localChanges]
  );

  // Toggle attendance status for a student
  const toggleStatus = useCallback(
    (studentId: string, currentStatus: AttendanceStatus) => {
      const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
      const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
      const nextStatus = STATUS_CYCLE[nextIndex];

      // Find the original status from the session data
      const originalStatus = session?.attendances.find(
        (a) => a.studentId === studentId
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
    [session?.attendances]
  );

  // Get effective status (local change or original)
  const getEffectiveStatus = useCallback(
    (studentId: string, originalStatus: AttendanceStatus): AttendanceStatus => {
      return localChanges[studentId] ?? originalStatus;
    },
    [localChanges]
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
        title: "Attendance saved!",
        description: `Updated ${updates.length} student(s) attendance.`,
      });
    } catch {
      toast({
        title: "Error saving attendance",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }, [localChanges, updateMutation, toast]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!session?.attendances) return { total: 0, present: 0, absent: 0, late: 0 };

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
      late: attendances.filter((a) => a.status === AttendanceStatus.LATE).length,
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
            <h2 className="text-xl font-semibold mb-2">No Circle Assigned</h2>
            <p className="text-muted-foreground">
              You don&apos;t have any circles assigned yet. Please contact an admin.
            </p>
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
            <h2 className="text-xl font-semibold mb-2">Failed to Load Session</h2>
            <p className="text-muted-foreground mb-4">
              Something went wrong while loading today&apos;s session.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
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
          {session ? formatDate(session.date) : "Today"}
        </h1>
        <p className="text-muted-foreground">{session?.circle?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.present}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      <div className="space-y-2">
        {session?.attendances.map((attendance) => {
          const effectiveStatus = getEffectiveStatus(
            attendance.studentId,
            attendance.status
          );
          const config = STATUS_CONFIG[effectiveStatus];
          const hasChange = localChanges[attendance.studentId] !== undefined;

          return (
            <StudentActionSheet
              key={attendance.id}
              student={attendance.student}
              sessionId={session!.id}
              circleId={circleId!}
            >
              <Card
                className={`transition-all cursor-pointer hover:shadow-md ${hasChange ? "ring-2 ring-primary" : ""}`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {getInitials(attendance.student.name)}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/students/${attendance.student.id}`}
                      className="font-medium truncate hover:text-primary hover:underline block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {attendance.student.name}
                    </Link>
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
                    <span className="ml-2">{config.label}</span>
                  </Button>
                </CardContent>
              </Card>
            </StudentActionSheet>
          );
        })}
      </div>

      {/* Empty state */}
      {session?.attendances.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No students in this circle yet.
            </p>
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
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes ({Object.keys(localChanges).length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
