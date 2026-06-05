"use client";

/**
 * Teacher Rewards Hooks
 *
 * Hooks for fetching teacher-visible reward rules and awarding points.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

import { useAuth } from "./use-auth";

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
    queryKey: ["points", "rules", "teacher"] as const,
    queryFn: async () => {
      const data = await apiClient.get<TeacherRewardRule[]>("/points/rules/teacher");
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}



/**
 * Hook to fetch teacher's budget for a session
 */
export function useTeacherBudget(sessionId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["points", "budget", sessionId, user?.id] as const,
    queryFn: async () => {
      // API now returns weekly budget, but we still trigger it per session view
      const data = await apiClient.get<{ used: number; limit: number; remaining: number }>(
        "/points/budget",
        { params: { sessionId } },
      );
      return data;
    },
    enabled: !!sessionId && sessionId !== "undefined" && !!user?.id,
  });
}

/**
 * Hook to add manual points (used for Undo)
 */
export function useAddManualPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: { studentId: string; amount: number; reason: string; sessionId: string }) => {
      const data = await apiClient.post("/points/manual", dto);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["points", "history", variables.studentId] as const });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(variables.studentId) });
      queryClient.invalidateQueries({ queryKey: ["points", "budget", variables.sessionId] as const });
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
      const data = await apiClient.post("/points/award-by-rule", dto);
      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate student points
      queryClient.invalidateQueries({ queryKey: ["points", "history", variables.studentId] as const });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(variables.studentId) });
      // Invalidate budget
      queryClient.invalidateQueries({ queryKey: ["points", "budget", variables.sessionId] as const });
    },
  });
}
