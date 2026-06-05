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

import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

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
  target: number;
  targetUnit: string | null;
  currentProgress: number;
}

export type GroupedQuestsResponse = Record<QuestCategory, QuestWithCompletion[]>;

export interface CompleteQuestResponse {
  success: true;
  earnedXp: number;
  baseXp: number;
  multiplier: number;
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
  shieldUsed: boolean;
  shieldEarned?: boolean;
  streakShields: number;
}

export interface LogProgressResponse {
  currentProgress: number;
  target: number;
  justCompleted: boolean;
  earnedXp?: number;
  baseXp?: number;
  multiplier?: number;
  newTotalXp?: number;
  levelUp?: boolean;
  newLevel?: number;
  unlockedMilestones?: unknown[];
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
      const data = await apiClient.get<GroupedQuestsResponse>(
        "/student-portal/quests",
      );
      return data;
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
      const data = await apiClient.post<CompleteQuestResponse>(
        `/student-portal/quests/${questId}/complete`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentQuestKeys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
    },
  });
}

/**
 * Log quest progress mutation.
 */
export function useLogQuestProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questId,
      amount = 1,
    }: {
      questId: string;
      amount?: number;
    }) => {
      const data = await apiClient.post<LogProgressResponse>(
        `/student-portal/quests/${questId}/log-progress`,
        { amount },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentQuestKeys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
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
      const data = await apiClient.get<TodayQuestsResponse>(
        "/student-portal/quests/today",
        {
          params: { campaignKey },
        },
      );
      return data;
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
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (dto: SubmitQuestRequest) => {
      const res = await apiClient.post<SubmitQuestResponse>(
        "/student-portal/quests/submit",
        dto,
      );
      return res;
    },
    onSuccess: (data) => {
      // Invalidate quest status
      queryClient.invalidateQueries({
        queryKey: studentQuestKeys.all,
      });

      // Invalidate user profile (HUD) - students get profile from auth
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.profile(),
      });

      // Invalidate daily challenge student info
      queryClient.invalidateQueries({
        queryKey: queryKeys.dailyChallenge.all,
      });

      if (data.shieldUsed) {
        toast({
          title: "🛡️ تم حماية سلسلتك!",
          description: `تم استخدام درع تلقائياً — باقي لديك ${data.streakShields} دروع.`,
        });
      }

      if (data.shieldEarned) {
        toast({
          title: "🎉 حصلت على درع جديد!",
          description: `لديك الآن ${data.streakShields}/3 دروع.`,
        });
      }
    },
  });
}
