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
 * Hook to fetch teacher's budget for a session
 */
export function useTeacherBudget(sessionId: string) {
  return useQuery({
    queryKey: ["points", "budget", sessionId],
    queryFn: async () => {
      const response = await api.get<{ used: number; limit: number; remaining: number }>(
        "/points/budget",
        { params: { sessionId } },
      );
      return response.data;
    },
    enabled: !!sessionId && sessionId !== "undefined",
  });
}

/**
 * Hook to add manual points (used for Undo)
 */
export function useAddManualPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: { studentId: string; amount: number; reason: string; sessionId: string }) => {
      const response = await api.post("/points/manual", dto);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["points", "history", variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ["student", variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ["points", "budget", variables.sessionId] });
    },
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
      // Invalidate budget
      queryClient.invalidateQueries({ queryKey: ["points", "budget", variables.sessionId] });
    },
  });
}
