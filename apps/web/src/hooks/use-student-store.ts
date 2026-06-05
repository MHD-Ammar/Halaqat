"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export type StoreItemType =
  | "AVATAR_FRAME"
  | "TITLE"
  | "STREAK_SHIELD"
  | "REAL_WORLD"
  | "DOUBLE_XP";

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  type: StoreItemType;
  xpCost: number;
  rewardValue: string | null;
  isActive: boolean;
  stock: number | null;
  limitPerStudent: number | null;
  minLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreItemWithStatus extends StoreItem {
  canAfford: boolean;
  meetsLevelReq: boolean;
  withinLimit: boolean;
  inStock: boolean;
  canPurchase: boolean;
}

export interface PurchaseItemResponse {
  success: boolean;
  message: string;
  newXpBalance: number;
}

export function useStoreItems() {
  return useQuery({
    queryKey: queryKeys.studentStore.all,
    queryFn: async () => {
      const data = await apiClient.get<StoreItemWithStatus[]>("/student-portal/store");
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function usePurchaseItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const data = await apiClient.post<PurchaseItemResponse>(
        `/student-portal/store/${itemId}/purchase`
      );
      return data;
    },
    onSuccess: () => {
      // Invalidate store items to update limit/affordability statuses
      queryClient.invalidateQueries({ queryKey: queryKeys.studentStore.all });
      // Invalidate dashboard to update XP
      queryClient.invalidateQueries({ queryKey: queryKeys.studentPortal.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.studentPortal.all });
    },
  });
}

export interface PurchaseHistoryItem {
  id: string;
  itemName: string;
  itemIcon: string;
  itemType: StoreItemType;
  xpSpent: number;
  purchasedAt: string;
  fulfillmentStatus: string | null;
  fulfillmentNotes: string | null;
  fulfilledAt: string | null;
}

export function usePurchaseHistory() {
  return useQuery({
    queryKey: ["student-store-purchases"] as const,
    queryFn: async () => {
      const data = await apiClient.get<PurchaseHistoryItem[]>("/student-portal/store/purchases");
      return data;
    },
    staleTime: 60 * 1000,
  });
}
