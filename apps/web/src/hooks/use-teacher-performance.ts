"use client";

/**
 * useTeacherPerformance Hook
 *
 * Fetches teacher performance data for admin dashboard.
 */

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

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
    queryKey: ["analytics", "teachers"],
    queryFn: async () => {
      const response = await api.get<PerformanceResponse>(
        "/analytics/teachers",
      );
      return response.data.data;
    },
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

export type { TeacherPerformance };
