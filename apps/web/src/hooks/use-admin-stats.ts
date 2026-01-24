"use client";

/**
 * useAdminStats Hook
 *
 * Fetches analytics overview data for admin dashboard.
 */

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

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
    queryKey: ["analytics", "overview"],
    queryFn: async () => {
      const response = await api.get<OverviewResponse>("/analytics/overview");
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export type { DailyOverview };
