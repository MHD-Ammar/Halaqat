"use client";

/**
 * useTeacherQuests Hooks
 *
 * React Query hooks for managing circle-scoped teacher quests:
 * - useTeacherQuests: fetch quests for the teacher's circle
 * - useCreateTeacherQuest: create a new circle quest
 * - useUpdateTeacherQuest: update a circle quest
 * - useDeleteTeacherQuest: delete a circle quest
 */

import type { QuestCategory, QuestFrequency } from "@halaqat/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

// --- Types ---

export interface TeacherQuest {
  id: string;
  title: string;
  description: string | null;
  category: QuestCategory;
  frequency: QuestFrequency;
  xpReward: number;
  icon: string;
  isActive: boolean;
  circleId: string;
  createdAt: string;
}

export interface CreateTeacherQuestDto {
  title: string;
  description?: string | null;
  category: QuestCategory;
  frequency: QuestFrequency;
  xpReward: number;
  icon: string;
}

// --- Query Keys ---

export const teacherQuestKeys = {
  all: ["teacher-quests"] as const,
  list: () => [...teacherQuestKeys.all, "list"] as const,
};

// --- Hooks ---

export function useTeacherQuests() {
  return useQuery({
    queryKey: teacherQuestKeys.list(),
    queryFn: async () => {
      const data = await apiClient.get<TeacherQuest[]>("/teacher/quests");
      return data;
    },
  });
}

export function useCreateTeacherQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateTeacherQuestDto) => {
      const data = await apiClient.post<TeacherQuest>("/teacher/quests", dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherQuestKeys.all });
    },
  });
}

export function useUpdateTeacherQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateTeacherQuestDto>;
    }) => {
      const data = await apiClient.put<TeacherQuest>(
        `/teacher/quests/${id}`,
        dto,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherQuestKeys.all });
    },
  });
}

export function useDeleteTeacherQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/teacher/quests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherQuestKeys.all });
    },
  });
}
