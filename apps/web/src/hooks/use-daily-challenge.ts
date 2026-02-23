import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

// --- Types ---
export interface ChallengeCircle {
  id: string;
  name: string;
}

export interface ChallengeStudent {
  id: string;
  name: string;
}

export interface ChallengeStudentInfo {
  id: string;
  name: string;
  currentStreak: number;
  lastSubmissionDate: string | null;
  hasSubmittedToday: boolean;
}

export interface SubmitChallengeDto {
  studentId: string;
  campaignKey?: string;
  campaignId?: string;
  submissionData: Record<string, unknown>;
  localDate: string;
}

export interface ChallengeLeaderboardEntry {
  studentId: string;
  name: string;
  totalXp: number;
  streak: number;
}

export interface CircleAverage {
  circleId: string;
  circleName: string;
  studentCount: number;
  totalXp: number;
  avgXp: number;
}

export interface LeaderboardResponse {
  students: ChallengeLeaderboardEntry[];
  circleAverages: CircleAverage[];
}

export interface ActiveCampaignResponse {
  campaignId: string | null;
  title?: string;
  startDate?: string;
  endDate?: string;
  config: { 
    questions?: unknown[] | Record<string, unknown>; 
    submitted_xp?: number 
  } | null;
}

// --- Keys ---
export const challengeKeys = {
  all: ["daily-challenge"] as const,
  activeCampaign: () => [...challengeKeys.all, "active-campaign"] as const,
  circles: (mosqueId: string) => [...challengeKeys.all, "circles", mosqueId] as const,
  students: (circleId: string) => [...challengeKeys.all, "students", circleId] as const,
  studentInfo: (studentId: string, campaign: string) =>
    [...challengeKeys.all, "student-info", studentId, campaign] as const,
  leaderboard: (mosqueId: string, campaign: string) =>
    [...challengeKeys.all, "leaderboard", mosqueId, campaign] as const,
};

// --- Hooks ---

/**
 * Get active campaign config (Public)
 * Used by /ramadan and student portals to render dynamic forms
 */
export function useActiveCampaign() {
  return useQuery({
    queryKey: challengeKeys.activeCampaign(),
    queryFn: async () => {
      const { data } = await api.get<ActiveCampaignResponse>("/daily-challenge/active-campaign");
      return data;
    },
  });
}

/**
 * Get circles for a mosque (Public)
 */
export function useDailyChallengeCircles(mosqueId?: string) {
  return useQuery({
    queryKey: challengeKeys.circles(mosqueId || "default"),
    queryFn: async () => {
      const params = mosqueId ? { mosqueId } : {};
      const { data } = await api.get<ChallengeCircle[]>("/daily-challenge/circles", {
        params,
      });
      return data;
    },
  });
}

/**
 * Get students for a circle (Public)
 */
export function useDailyChallengeStudents(circleId: string | null) {
  return useQuery({
    queryKey: challengeKeys.students(circleId!),
    queryFn: async () => {
      const { data } = await api.get<ChallengeStudent[]>(
        `/daily-challenge/students/${circleId}`,
      );
      return data;
    },
    enabled: !!circleId,
  });
}

/**
 * Get student info & streak (Public)
 */
export function useDailyChallengeStudentInfo(studentId: string | null, campaign: string) {
  return useQuery({
    queryKey: challengeKeys.studentInfo(studentId!, campaign),
    queryFn: async () => {
      const { data } = await api.get<ChallengeStudentInfo>(
        `/daily-challenge/student-info/${studentId}`,
        { params: { campaign } }
      );
      return data;
    },
    enabled: !!studentId,
  });
}

/**
 * Submit daily challenge
 */
export function useDailyChallengeSubmit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: SubmitChallengeDto) => {
      const { data } = await api.post("/daily-challenge/submit", dto);
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate student info to update streak
      queryClient.invalidateQueries({
        queryKey: challengeKeys.studentInfo(
          variables.studentId,
          variables.campaignKey ?? variables.campaignId ?? "ramadan"
        ),
      });
      // Invalidate leaderboard
      queryClient.invalidateQueries({
        queryKey: challengeKeys.all,
      });
    },
  });
}

/**
 * Get Leaderboard
 */
export function useDailyChallengeLeaderboard(mosqueId?: string, campaign: string = "ramadan") {
  return useQuery({
    queryKey: challengeKeys.leaderboard(mosqueId || "default", campaign),
    queryFn: async () => {
      const params = mosqueId ? { mosqueId, campaign } : { campaign };
      const { data } = await api.get<LeaderboardResponse>(
        "/daily-challenge/leaderboard",
        { params },
      );
      return data;
    },
  });
}
