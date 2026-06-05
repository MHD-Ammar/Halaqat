"use client";

/**
 * Settings Hooks
 *
 * Fetches and manages mosque and point rules settings for admin panel
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

// ==================== TYPES ====================

export interface Mosque {
  id: string;
  name: string;
  code: string;
  manualPointLimit?: number;
}

export interface PointRule {
  id: number;
  key: string;
  description: string;
  points: number;
  isActive: boolean;
  mosqueId: string;
  /** System rules (like Attendance) cannot be deleted */
  isSystem: boolean;
  /** Whether this rule appears in the teacher's Quick Reward menu */
  isVisibleToTeacher: boolean;
  /** If true, teacher enters points manually (variable input) */
  isCustomEntry: boolean;
  /** Maximum points for custom entry rules */
  maxCustomValue: number | null;
}

export interface UpdateMosqueDto {
  name: string;
  manualPointLimit?: number;
}

export interface BulkUpdatePointRulesDto {
  rules: { key: string; points: number }[];
}

export interface CreatePointRuleDto {
  description: string;
  points: number;
  isVisibleToTeacher?: boolean;
  isCustomEntry?: boolean;
  maxCustomValue?: number;
}

// ==================== MOSQUE HOOKS ====================

/**
 * Hook to get current user's mosque
 */
export function useMosqueSettings() {
  return useQuery({
    queryKey: queryKeys.settings.mosque(),
    queryFn: async () => {
      const data = await apiClient.get<{ message: string; data: Mosque }>("/mosques/my-mosque");
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to update current user's mosque
 */
export function useUpdateMosque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: UpdateMosqueDto) => {
      const res = await apiClient.patch<{ message: string; data: Mosque }>(
        "/mosques/my-mosque",
        dto,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.mosque() });
    },
  });
}

// ==================== POINT RULES HOOKS ====================

/**
 * Hook to get all point rules for current user's mosque
 */
export function usePointRules() {
  return useQuery({
    queryKey: queryKeys.settings.pointRules(),
    queryFn: async () => {
      const data = await apiClient.get<PointRule[]>("/points/rules");
      return data;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}

/**
 * Hook to bulk update point rules
 */
export function useUpdatePointRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: BulkUpdatePointRulesDto) => {
      const res = await apiClient.put<{ message: string; data: PointRule[] }>(
        "/points/rules",
        dto,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.pointRules() });
    },
  });
}

/**
 * Hook to create a custom reward rule
 */
export function useCreateCustomRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreatePointRuleDto) =>
      apiClient.post<PointRule>("/points/rules", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.pointRules() });
    },
  });
}

/**
 * Hook to delete a custom reward rule
 */
export function useDeleteCustomRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: number) => {
      await apiClient.delete(`/points/rules/${ruleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.pointRules() });
    },
  });
}
