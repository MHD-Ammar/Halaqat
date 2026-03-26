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
  target: number;
  targetUnit: string | null;
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

export interface SeasonalEvent {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  startsAt: string;
  endsAt: string;
  xpMultiplier: number;
  icon: string;
  themeColor: string;
  bannerUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface EventQuest {
  id: string;
  eventId: string;
  questId: string;
  bonusXp: number;
  quest: Quest;
}

// --- Query Keys ---

export const adminGamificationKeys = {
  all: ["admin-gamification"] as const,
  quests: () => [...adminGamificationKeys.all, "quests"] as const,
  milestones: () => [...adminGamificationKeys.all, "milestones"] as const,
  achievements: () => [...adminGamificationKeys.all, "achievements"] as const,
  events: () => [...adminGamificationKeys.all, "events"] as const,
  eventQuests: (eventId: string) => [...adminGamificationKeys.all, "events", eventId, "quests"] as const,
};

// ... (existing hooks)

// ============================================================================
// Seasonal Events Hooks
// ============================================================================

export function useAdminEvents() {
  return useQuery({
    queryKey: adminGamificationKeys.events(),
    queryFn: async () => {
      const { data } = await api.get<SeasonalEvent[]>("/gamification/admin/events");
      return data;
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<SeasonalEvent>) => {
      const { data } = await api.post<SeasonalEvent>("/gamification/admin/events", dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGamificationKeys.events() });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: Partial<SeasonalEvent> }) => {
      const { data } = await api.put<SeasonalEvent>(`/gamification/admin/events/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGamificationKeys.events() });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/gamification/admin/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminGamificationKeys.events() });
    },
  });
}

export function useEventQuests(eventId: string) {
  return useQuery({
    queryKey: adminGamificationKeys.eventQuests(eventId),
    queryFn: async () => {
      const { data } = await api.get<EventQuest[]>(`/gamification/admin/events/${eventId}/quests`);
      return data;
    },
    enabled: !!eventId,
  });
}

export function useAddQuestToEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, questId, bonusXp }: { eventId: string; questId: string; bonusXp?: number }) => {
      const { data } = await api.post<EventQuest>(`/gamification/admin/events/${eventId}/quests`, { questId, bonusXp });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminGamificationKeys.eventQuests(variables.eventId) });
    },
  });
}

export function useRemoveQuestFromEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, questId }: { eventId: string; questId: string }) => {
      await api.delete(`/gamification/admin/events/${eventId}/quests/${questId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminGamificationKeys.eventQuests(variables.eventId) });
    },
  });
}

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

// ============================================================================
// Store Fulfillments Hooks
// ============================================================================

export interface FulfillmentItem {
  id: string;
  studentName: string;
  studentId: string;
  itemName: string;
  itemIcon: string;
  xpSpent: number;
  purchasedAt: string;
  fulfillmentStatus: "pending" | "fulfilled" | "cancelled";
}

export function usePendingFulfillments() {
  return useQuery({
    queryKey: [...adminGamificationKeys.all, "fulfillments"] as const,
    queryFn: async () => {
      const { data } = await api.get<FulfillmentItem[]>("/gamification/admin/pending-fulfillments");
      return data;
    },
  });
}

export function useUpdateFulfillment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: "fulfilled" | "cancelled"; notes?: string }) => {
      const { data } = await api.patch(`/gamification/admin/fulfillments/${id}`, { status, notes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...adminGamificationKeys.all, "fulfillments"] });
    },
  });
}
