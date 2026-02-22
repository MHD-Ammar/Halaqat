"use client";

/**
 * useStudentQuests Hook
 *
 * React Query hook for managing student daily quests:
 * - Fetch today's quest status
 * - Submit daily quests with gamification
 * - Handle level-up state
 */

import { CampaignConfig } from "@halaqat/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { useUserProfile } from "./use-user-profile";

// --- Types ---

export interface TodayQuestsResponse {
  hasSubmittedToday: boolean;
  todayXpEarned?: number;
  config: CampaignConfig;
}

export interface SubmitQuestRequest {
  submissionData: Record<string, unknown>;
  campaignKey?: string;
  localDate?: string;
}

export interface SubmitQuestResponse {
  success: true;
  earnedXp: number;
  newTotalXp: number;
  levelUp: boolean;
  newLevel: number;
  currentStreak: number;
  maxStreak: number;
}

// --- Query Keys ---

export const studentQuestKeys = {
  all: ["student-quests"] as const,
  today: (campaignKey: string = "ramadan") =>
    [...studentQuestKeys.all, "today", campaignKey] as const,
  submit: ["student-quests-submit"] as const,
};

// --- Hooks ---

/**
 * Fetch today's quest status and campaign config
 */
export function useTodayQuests(campaignKey: string = "ramadan") {
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

  const query = useQuery({
    queryKey: studentQuestKeys.today(campaignKey),
    queryFn: async () => {
      const response = await api.get<TodayQuestsResponse>(
        "/student-portal/quests/today",
        {
          params: { campaignKey },
        },
      );
      return response.data;
    },
    enabled: !!userProfile && userProfile.role === "STUDENT",
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    ...query,
    isLoading: isProfileLoading || query.isLoading,
  };
}

/**
 * Submit daily quests mutation
 */
export function useSubmitStudentQuests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitQuestRequest) => {
      const response = await api.post<SubmitQuestResponse>(
        "/student-portal/quests/submit",
        data,
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate quest status
      queryClient.invalidateQueries({
        queryKey: studentQuestKeys.today(variables.campaignKey || "ramadan"),
      });

      // Invalidate student profile to update HUD
      queryClient.invalidateQueries({
        queryKey: ["student-profile"],
      });

      // Invalidate daily challenge student info
      queryClient.invalidateQueries({
        queryKey: ["daily-challenge"],
      });
    },
  });
}
