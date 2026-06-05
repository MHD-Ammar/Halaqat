"use client";

/**
 * useStudentProfile Hook
 *
 * Fetches comprehensive student profile with stats.
 */

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

interface StudentStats {
  attendanceRate: number;
  totalRecitations: number;
  totalPoints: number;
}

interface Recitation {
  id: string;
  type: string;
  quality: string;
  pageNumber: number;
  surahName?: string;
  surahNameArabic?: string;
  createdAt: string;
}

interface PointTransaction {
  id: string;
  amount: number;
  reason: string;
  sourceType: string;
  createdAt: string;
}

interface AttendanceRecord {
  id: string;
  status: string;
  createdAt: string;
  sessionDate: string;
}

interface Student {
  id: string;
  name: string;
  phone: string | null;
  totalPoints: number;
  circle: {
    id: string;
    name: string;
  } | null;
}

interface StudentProfile {
  student: Student;
  stats: StudentStats;
  recentActivity: Recitation[];
  pointsHistory: PointTransaction[];
  attendanceHistory: AttendanceRecord[];
}

/**
 * Fetch student profile with aggregated data
 */
export function useStudentProfile(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.students.profile(studentId ?? ""),
    queryFn: () => apiClient.get<StudentProfile>(`/students/${studentId}/profile`),
    enabled: !!studentId,
    staleTime: 30 * 1000,
  });
}

export type {
  StudentProfile,
  Student,
  StudentStats,
  Recitation,
  PointTransaction,
  AttendanceRecord,
};
