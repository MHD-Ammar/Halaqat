"use client";

/**
 * useTeacherStats Hook
 *
 * Fetches analytics overview data for teacher dashboard (their circles only).
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
 * Fetch teacher-specific overview statistics
 */
export function useTeacherStats(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["analytics", "my-overview"],
    queryFn: async () => {
      const response = await api.get<OverviewResponse>(
        "/analytics/my-overview",
      );
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export type { DailyOverview as TeacherStats };
