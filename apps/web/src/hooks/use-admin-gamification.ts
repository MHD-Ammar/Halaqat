import { QuestCategory, QuestFrequency } from "@halaqat/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

// --- Types ---

export type RewardType = "BONUS_XP" | "AVATAR_FRAME" | "TITLE";
export type AchievementCriteriaType = "TOTAL_QUESTS_CATEGORY" | "STREAK_DAYS" | "TOTAL_XP";

export interface Quest {
  id: string;
  title: string;
  description: string | null;
  category: QuestCategory;
  frequency: QuestFrequency;
  xpReward: number;
  icon: string;
  isActive: boolean;
  createdAt: string;
}

export interface MilestoneReward {
  id: string;
  targetLevel: number;
  title: string;
  rewardType: RewardType;
  rewardValue: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badgeIcon: string;
  criteriaType: AchievementCriteriaType;
  criteriaTarget: number;
  criteriaCategory: QuestCategory | null;
  createdAt: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
}

// --- Query Keys ---

export const adminGamificationKeys = {
  all: ["admin-gamification"] as const,
  quests: () => [...adminGamificationKeys.all, "quests"] as const,
  milestones: () => [...adminGamificationKeys.all, "milestones"] as const,
  achievements: () => [...adminGamificationKeys.all, "achievements"] as const,
};

// ============================================================================
// Quests Hooks
// ============================================================================

export function useAdminQuests() {
  return useQuery({
    queryKey: adminGamificationKeys.quests(),
    queryFn: async () => {
      const { data } = await api.get<Quest[]>("/gamification/admin/quests");
      return data;
    },
  });
}

export function useCreateQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<Quest>) => {
      const { data } = await api.post<Quest>("/gamification/admin/quests", dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGamificationKeys.quests() });
    },
  });
}

export function useUpdateQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: Partial<Quest> }) => {
      const { data } = await api.put<Quest>(`/gamification/admin/quests/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGamificationKeys.quests() });
    },
  });
}

export function useDeleteQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/gamification/admin/quests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGamificationKeys.quests() });
    },
  });
}

// ============================================================================
// Milestones Hooks
// ============================================================================

export function useAdminMilestones() {
  return useQuery({
    queryKey: adminGamificationKeys.milestones(),
    queryFn: async () => {
      const { data } = await api.get<MilestoneReward[]>("/gamification/admin/milestones");
      return data;
    },
  });
}

export function useCreateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<MilestoneReward>) => {
      const { data } = await api.post<MilestoneReward>("/gamification/admin/milestones", dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGamificationKeys.milestones() });
    },
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: Partial<MilestoneReward> }) => {
      const { data } = await api.put<MilestoneReward>(`/gamification/admin/milestones/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGamificationKeys.milestones() });
    },
  });
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/gamification/admin/milestones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGamificationKeys.milestones() });
    },
  });
}

// ============================================================================
// Achievements Hooks
// ============================================================================

export function useAdminAchievements() {
  return useQuery({
    queryKey: adminGamificationKeys.achievements(),
    queryFn: async () => {
      const { data } = await api.get<Achievement[]>("/gamification/admin/achievements");
      return data;
    },
  });
}

export function useCreateAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<Achievement>) => {
      const { data } = await api.post<Achievement>("/gamification/admin/achievements", dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGamificationKeys.achievements() });
    },
  });
}

export function useUpdateAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: Partial<Achievement> }) => {
      const { data } = await api.put<Achievement>(`/gamification/admin/achievements/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGamificationKeys.achievements() });
    },
  });
}

export function useDeleteAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/gamification/admin/achievements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGamificationKeys.achievements() });
    },
  });
}
