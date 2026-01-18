"use client";

/**
 * Dashboard Overview Page
 *
 * For Admin/Supervisor: Displays analytics and teacher performance.
 * For Teacher: Displays personal stats and student list.
 */

import Link from "next/link";
import {
  Users,
  Percent,
  Star,
  Activity,
  AlertTriangle,
  UserPlus,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatsCard } from "@/components/stats-card";
import { CreateTeacherDialog } from "@/components/create-teacher-dialog";
import { CreateStudentDialog } from "@/components/create-student-dialog";
import {
  useAdminStats,
  useTeacherPerformance,
  useAuth,
  useTeacherStats,
  useCircle,
} from "@/hooks";
import { useUserProfile } from "@/hooks/use-user-profile";

/**
 * Format date for display
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
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

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERVISOR";

  // Get teacher's first circle ID (for fetching students)
  const teacherCircleId = !isAdmin && profile?.circles?.[0]?.id;

  // Use different stats hooks based on role
  const { data: adminStats, isLoading: adminStatsLoading } = useAdminStats();
  const { data: teacherStatistics, isLoading: teacherStatsLoading } =
    useTeacherStats();
  const { data: teachers = [], isLoading: teachersLoading } =
    useTeacherPerformance();
  const { data: circleDetails, isLoading: circleLoading } = useCircle(
    teacherCircleId || undefined,
  );

  // For teachers, use their specific stats; for admins, use admin stats
  const stats = isAdmin ? adminStats : teacherStatistics;
  const statsLoading = isAdmin ? adminStatsLoading : teacherStatsLoading;

  // Students for teacher view
  const students = circleDetails?.students || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isAdmin ? "Dashboard Overview" : "My Performance"}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Monitor mosque performance and teacher activity"
            : "View your circle's statistics and students"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title={isAdmin ? "Total Students" : "My Students"}
          value={stats?.totalStudents ?? 0}
          icon={Users}
          iconColor="text-blue-500"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Attendance Rate"
          value={`${stats?.attendanceRate ?? 0}%`}
          icon={Percent}
          iconColor="text-green-500"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Points Today"
          value={stats?.pointsAwardedToday ?? 0}
          icon={Star}
          iconColor="text-yellow-500"
          isLoading={statsLoading}
        />
        <StatsCard
          title={isAdmin ? "Active Circles" : "My Circles"}
          value={
            isAdmin
              ? (stats?.activeCircles ?? 0)
              : (profile?.circles?.length ?? 0)
          }
          icon={Activity}
          iconColor="text-purple-500"
          isLoading={statsLoading}
        />
      </div>

      {/* Teacher: Students List */}
      {!isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Students
            </CardTitle>
            {teacherCircleId && (
              <CreateStudentDialog defaultCircleId={teacherCircleId}>
                <button className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                  <UserPlus className="h-4 w-4" />
                  Add Student
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
                <p>No students in your circle yet</p>
                {teacherCircleId && (
                  <CreateStudentDialog defaultCircleId={teacherCircleId}>
                    <button className="mt-3 text-primary hover:underline text-sm">
                      Add your first student
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
                          {student.totalPoints ?? 0} points
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
      )}

      {/* Admin: Teachers Table */}
      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teacher Performance
            </CardTitle>
            <CreateTeacherDialog />
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
                No teachers found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Circle</TableHead>
                      <TableHead className="text-center">Students</TableHead>
                      <TableHead>Last Session</TableHead>
                      <TableHead className="text-center">Status</TableHead>
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
                              {formatDate(teacher.lastSessionDate)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {isInactive ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Inactive
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700"
                              >
                                Active
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
      )}
    </div>
  );
}
