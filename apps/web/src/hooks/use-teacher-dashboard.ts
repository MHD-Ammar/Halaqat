"use client";

/**
 * useTeacherDashboard Hook
 *
 * Fetches comprehensive dashboard data for teacher with date range filtering.
 */

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface AttendanceTrendItem {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

export interface TopStudent {
  studentId: string;
  studentName: string;
  totalPoints: number;
  totalPages: number;
  attendanceRate: number;
}

export interface RecentSession {
  id: string;
  date: string;
  presentCount: number;
  absentCount: number;
  recitationCount: number;
}

export interface TeacherDashboardData {
  totalStudents: number;
  totalSessions: number;
  averageAttendanceRate: number;
  totalRecitations: number;
  totalPagesRecited: number;
  totalPointsAwarded: number;
  attendanceTrend: AttendanceTrendItem[];
  topStudents: TopStudent[];
  recentSessions: RecentSession[];
}

interface TeacherDashboardResponse {
  message: string;
  data: TeacherDashboardData;
}

/**
 * Fetch teacher dashboard data for a date range
 */
export function useTeacherDashboard(from: string, to: string) {
  return useQuery({
    queryKey: ["analytics", "teacher-dashboard", from, to],
    queryFn: async () => {
      const response = await api.get<TeacherDashboardResponse>(
        `/analytics/teacher-dashboard?from=${from}&to=${to}`,
      );
      return response.data.data;
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: !!from && !!to,
  });
}
