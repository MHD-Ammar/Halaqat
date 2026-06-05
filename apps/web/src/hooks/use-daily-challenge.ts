/**
 * Daily Challenge Hooks
 *
 * Public-facing hooks for the daily challenge / Ramadan submission flow.
 * Query keys now come from the central registry; apiClient replaces the
 * raw `api` instance for consistent error handling.
 *
 * All exported names are unchanged from the original.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

// ── Types ──────────────────────────────────────────────────────────────────

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

export interface SubmitChallengeResponse {
  xpEarned: number;
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
    submitted_xp?: number;
  } | null;
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useActiveCampaign() {
  return useQuery<ActiveCampaignResponse>({
    queryKey: queryKeys.dailyChallenge.activeCampaign(),
    queryFn: () =>
      apiClient.get<ActiveCampaignResponse>("/daily-challenge/active-campaign"),
  });
}

export function useDailyChallengeCircles(mosqueId?: string) {
  return useQuery<ChallengeCircle[]>({
    queryKey: queryKeys.dailyChallenge.circles(mosqueId ?? "default"),
    queryFn: () =>
      apiClient.get<ChallengeCircle[]>("/daily-challenge/circles", {
        params: mosqueId ? { mosqueId } : {},
      }),
  });
}

export function useDailyChallengeStudents(circleId: string | null) {
  return useQuery<ChallengeStudent[]>({
    queryKey: queryKeys.dailyChallenge.students(circleId!),
    queryFn: () =>
      apiClient.get<ChallengeStudent[]>(`/daily-challenge/students/${circleId}`),
    enabled: !!circleId,
  });
}

export function useDailyChallengeStudentInfo(
  studentId: string | null,
  campaign: string,
) {
  return useQuery<ChallengeStudentInfo>({
    queryKey: queryKeys.dailyChallenge.studentInfo(studentId!, campaign),
    queryFn: () =>
      apiClient.get<ChallengeStudentInfo>(
        `/daily-challenge/student-info/${studentId}`,
        { params: { campaign } },
      ),
    enabled: !!studentId,
  });
}

export function useDailyChallengeSubmit() {
  const qc = useQueryClient();
  return useMutation<SubmitChallengeResponse, Error, SubmitChallengeDto>({
    mutationFn: (dto) =>
      apiClient.post<SubmitChallengeResponse>("/daily-challenge/submit", dto),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: queryKeys.dailyChallenge.studentInfo(
          variables.studentId,
          variables.campaignKey ?? variables.campaignId ?? "ramadan",
        ),
      });
      qc.invalidateQueries({ queryKey: queryKeys.dailyChallenge.all });
    },
  });
}

export function useDailyChallengeLeaderboard(
  mosqueId?: string,
  campaign: string = "ramadan",
) {
  return useQuery<LeaderboardResponse>({
    queryKey: queryKeys.dailyChallenge.leaderboard(
      mosqueId ?? "default",
      campaign,
    ),
    queryFn: () =>
      apiClient.get<LeaderboardResponse>("/daily-challenge/leaderboard", {
        params: mosqueId ? { mosqueId, campaign } : { campaign },
      }),
  });
}
