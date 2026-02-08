"use client";

/**
 * Teacher Rewards Hooks
 *
 * Hooks for fetching teacher-visible reward rules and awarding points.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface TeacherRewardRule {
  id: number;
  key: string;
  description: string;
  points: number;
  isCustomEntry: boolean;
  maxCustomValue: number | null;
}

export interface AwardByRuleDto {
  ruleId: number;
  studentId: string;
  sessionId: string;
  customAmount?: number;
}

/**
 * Hook to fetch teacher-visible reward rules
 */
export function useTeacherRewards() {
  return useQuery({
    queryKey: ["points", "rules", "teacher"],
    queryFn: async () => {
      const response = await api.get<TeacherRewardRule[]>("/points/rules/teacher");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to award points by rule
 */
export function useAwardReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: AwardByRuleDto) => {
      const response = await api.post("/points/award-by-rule", dto);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate student points
      queryClient.invalidateQueries({ queryKey: ["points", "history", variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ["student", variables.studentId] });
    },
  });
}
