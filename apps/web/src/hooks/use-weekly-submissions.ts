import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

// --- Types ---

export interface WeeklySubmissionData {
  id: string;
  xp: number;
  streak: number;
}

export interface StudentWeeklySubmissions {
  studentId: string;
  name: string;
  submissions: Record<string, WeeklySubmissionData>; // date -> submission
}

export interface SubmissionDetail {
  id: string;
  studentName: string;
  date: string;
  totalXp: number;
  details: Record<string, unknown>;
}

// Query keys scoped under the existing dailyChallenge namespace
export const weeklyChallengeKeys = {
  weekly: (circleId: string, startDate: string, campaign: string) =>
    [...queryKeys.dailyChallenge.all, "weekly", circleId, startDate, campaign] as const,
  submission: (id: string) =>
    [...queryKeys.dailyChallenge.all, "submission", id] as const,
};

// --- Hooks ---

/**
 * Get weekly submissions for a circle
 */
export function useWeeklySubmissions(
  circleId: string | undefined,
  startDate: string,
  campaign: string = "ramadan"
) {
  return useQuery({
    queryKey: weeklyChallengeKeys.weekly(circleId || "undefined", startDate, campaign),
    queryFn: async () => {
      if (!circleId) return [];
      const data = await apiClient.get<StudentWeeklySubmissions[]>(
        "/daily-challenge/submissions/weekly",
        {
          params: { circleId, startDate, campaign },
        }
      );
      return data;
    },
    enabled: !!circleId && !!startDate,
  });
}

/**
 * Get single submission detail
 */
export function useSubmissionDetail(submissionId: string | null) {
  return useQuery({
    queryKey: weeklyChallengeKeys.submission(submissionId || "undefined"),
    queryFn: async () => {
      if (!submissionId) return null;
      const data = await apiClient.get<SubmissionDetail>(
        `/daily-challenge/submission/${submissionId}`
      );
      return data;
    },
    enabled: !!submissionId,
  });
}
