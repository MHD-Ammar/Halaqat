"use client";

/**
 * Admin Dashboard Page
 *
 * Displays analytics overview and teacher performance for Admin/Supervisor users.
 */

import { Users, Percent, Star, Activity, AlertTriangle } from "lucide-react";

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
import { StatsCard } from "@/components/stats-card";
import { useAdminStats, useTeacherPerformance } from "@/hooks";

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

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: teachers = [], isLoading: teachersLoading } =
    useTeacherPerformance();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor mosque performance and teacher activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Students"
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
          title="Active Circles"
          value={stats?.activeCircles ?? 0}
          icon={Activity}
          iconColor="text-purple-500"
          isLoading={statsLoading}
        />
      </div>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teacher Performance
          </CardTitle>
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
                        className={isInactive ? "bg-red-50 dark:bg-red-950/20" : ""}
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
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
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
    </div>
  );
}
