import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { challengeKeys } from "./use-daily-challenge";

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

// --- Keys Extension ---
// We'll add these to the existing keys object in use-daily-challenge if possible,
// or just define locally if that file is closed. 
// Since we can't easily modify the exported const in another file without replacing it,
// let's define local keys here that extend the pattern.

export const weeklyChallengeKeys = {
  weekly: (circleId: string, startDate: string, campaign: string) =>
    [...challengeKeys.all, "weekly", circleId, startDate, campaign] as const,
  submission: (id: string) => [...challengeKeys.all, "submission", id] as const,
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
      const { data } = await api.get<StudentWeeklySubmissions[]>(
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
      const { data } = await api.get<SubmissionDetail>(
        `/daily-challenge/submission/${submissionId}`
      );
      return data;
    },
    enabled: !!submissionId,
  });
}
