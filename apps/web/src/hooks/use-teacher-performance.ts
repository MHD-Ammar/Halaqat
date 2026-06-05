"use client";

/**
 * useTeacherPerformance Hook
 *
 * Fetches teacher performance data for admin dashboard.
 */

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

interface TeacherPerformance {
  teacherId: string;
  teacherName: string;
  circleName: string;
  studentCount: number;
  lastSessionDate: string | null;
  isActive: boolean;
}

interface PerformanceResponse {
  message: string;
  data: TeacherPerformance[];
}

/**
 * Fetch teacher performance data
 */
export function useTeacherPerformance(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.adminStats.teacherPerformance("all", "", ""),
    queryFn: async () => {
      const data = await apiClient.get<PerformanceResponse>(
        "/analytics/teachers",
      );
      return data.data;
    },
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

export type { TeacherPerformance };
