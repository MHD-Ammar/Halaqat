"use client";

/**
 * useAdminStats Hook
 *
 * Fetches analytics overview data for admin dashboard.
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
 * Fetch daily overview statistics
 */
export function useAdminStats(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.adminStats.overview(),
    queryFn: async () => {
      const data = await apiClient.get<OverviewResponse>("/analytics/overview");
      return data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export type { DailyOverview };
