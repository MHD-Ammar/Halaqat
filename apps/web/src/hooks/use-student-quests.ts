"use client";

/**
 * useStudentQuests Hook
 *
 * React Query hook for managing student quests:
 * - Granular quests (useStudentQuests): fetch grouped quests with completion status
 * - Complete individual quest (useCompleteQuest): POST complete, invalidates quests & profile
 * - Legacy: useTodayQuests, useSubmitStudentQuests (campaign form submission)
 */

import type { QuestCategory } from "@halaqat/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { useUserProfile } from "./use-user-profile";

// --- Types ---

export interface QuestWithCompletion {
  id: string;
  title: string;
  description: string | null;
  category: QuestCategory;
  frequency: string;
  xpReward: number;
  icon: string;
  isCompleted: boolean;
  circleId: string | null;
}

export type GroupedQuestsResponse = Record<QuestCategory, QuestWithCompletion[]>;

export interface CompleteQuestResponse {
  success: true;
  earnedXp: number;
  newTotalXp: number;
  levelUp: boolean;
  newLevel: number;
  newAchievements?: {
    id: string;
    title: string;
    description: string;
    badgeIcon: string;
    criteriaType?: string;
    criteriaTarget?: number;
    criteriaCategory?: QuestCategory | null;
    isUnlocked?: boolean;
    unlockedAt?: string | null;
  }[];
}

export interface TodayQuestsResponse {
  hasSubmittedToday: boolean;
  todayXpEarned?: number;
  campaignId?: string;
  config: { questions?: unknown[]; submitted_xp?: number } | null;
}

export interface SubmitQuestRequest {
  submissionData: Record<string, unknown>;
  campaignKey?: string;
  campaignId?: string;
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
  quests: () => [...studentQuestKeys.all, "grouped"] as const,
  today: (campaignKey: string = "ramadan") =>
    [...studentQuestKeys.all, "today", campaignKey] as const,
  submit: ["student-quests-submit"] as const,
};

// --- Hooks ---

/**
 * Fetch all quests grouped by category with completion status
 */
export function useStudentQuests() {
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

  const query = useQuery({
    queryKey: studentQuestKeys.quests(),
    queryFn: async () => {
      const response = await api.get<GroupedQuestsResponse>(
        "/student-portal/quests",
      );
      return response.data;
    },
    enabled: !!userProfile && userProfile.role === "STUDENT",
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    ...query,
    isLoading: isProfileLoading || query.isLoading,
  };
}

/**
 * Complete a quest mutation. On success invalidates useStudentQuests and useUserProfile.
 */
export function useCompleteQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questId: string) => {
      const response = await api.post<CompleteQuestResponse>(
        `/student-portal/quests/${questId}/complete`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentQuestKeys.all });
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    },
  });
}

/**
 * Fetch today's quest status and campaign config (legacy)
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
    onSuccess: (_data) => {
      // Invalidate quest status
      queryClient.invalidateQueries({
        queryKey: studentQuestKeys.all,
      });

      // Invalidate user profile (HUD) - students get profile from auth
      queryClient.invalidateQueries({
        queryKey: ["user", "profile"],
      });

      // Invalidate daily challenge student info
      queryClient.invalidateQueries({
        queryKey: ["daily-challenge"],
      });
    },
  });
}
