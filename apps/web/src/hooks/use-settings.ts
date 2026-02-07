"use client";

/**
 * Settings Hooks
 *
 * Fetches and manages mosque and point rules settings for admin panel
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

// ==================== TYPES ====================

export interface Mosque {
  id: string;
  name: string;
  code: string;
}

export interface PointRule {
  id: number;
  key: string;
  description: string;
  points: number;
  isActive: boolean;
  mosqueId: string;
}

export interface UpdateMosqueDto {
  name: string;
}

export interface BulkUpdatePointRulesDto {
  rules: { key: string; points: number }[];
}

// ==================== MOSQUE HOOKS ====================

/**
 * Hook to get current user's mosque
 */
export function useMosqueSettings() {
  return useQuery({
    queryKey: ["mosque", "my-mosque"],
    queryFn: async () => {
      const response = await api.get<{ message: string; data: Mosque }>("/mosques/my-mosque");
      return response.data.data;
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
    mutationFn: async (data: UpdateMosqueDto) => {
      const response = await api.patch<{ message: string; data: Mosque }>(
        "/mosques/my-mosque",
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mosque", "my-mosque"] });
    },
  });
}

// ==================== POINT RULES HOOKS ====================

/**
 * Hook to get all point rules for current user's mosque
 */
export function usePointRules() {
  return useQuery({
    queryKey: ["points", "rules"],
    queryFn: async () => {
      const response = await api.get<PointRule[]>("/points/rules");
      return response.data;
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
    mutationFn: async (data: BulkUpdatePointRulesDto) => {
      const response = await api.put<{ message: string; data: PointRule[] }>(
        "/points/rules",
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points", "rules"] });
    },
  });
}
