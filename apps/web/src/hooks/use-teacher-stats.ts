"use client";

/**
 * useTeacherStats Hook
 *
 * Fetches analytics overview data for teacher dashboard (their circles only).
 */

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

interface DailyOverview {
  totalStudents: number;
  attendanceRate: number;
  pointsAwardedToday: number;
  activeCircles: number;
}

interface OverviewResponse {
  message: string;
  data: DailyOverview;
}

/**
 * Fetch teacher-specific overview statistics
 */
export function useTeacherStats(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.adminStats.all,
    queryFn: async () => {
      const data = await apiClient.get<OverviewResponse>(
        "/analytics/my-overview",
      );
      return data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export type { DailyOverview as TeacherStats };
