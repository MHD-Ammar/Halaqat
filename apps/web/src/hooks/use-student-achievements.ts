"use client";

import type { QuestCategory } from "@halaqat/types";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { useUserProfile } from "./use-user-profile";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badgeIcon: string;
  criteriaType: string;
  criteriaTarget: number;
  criteriaCategory: QuestCategory | null;
  isUnlocked: boolean;
  unlockedAt: string | null;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  currentProgress: number;
  progressPercent: number;
}

export const achievementKeys = {
  all: ["student-achievements"] as const,
};

export function useStudentAchievements() {
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

  const query = useQuery({
    queryKey: achievementKeys.all,
    queryFn: async () => {
      const response = await api.get<Achievement[]>("/student-portal/achievements");
      return response.data;
    },
    enabled: !!userProfile && userProfile.role === "STUDENT",
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    isLoading: isProfileLoading || query.isLoading,
  };
}
