"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

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
    queryKey: ["student-store-items"],
    queryFn: async () => {
      const response = await api.get<StoreItemWithStatus[]>("/student-portal/store");
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

export function usePurchaseItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const response = await api.post<PurchaseItemResponse>(
        `/student-portal/store/${itemId}/purchase`
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate store items to update limit/affordability statuses
      queryClient.invalidateQueries({ queryKey: ["student-store-items"] });
      // Invalidate dashboard to update XP
      queryClient.invalidateQueries({ queryKey: ["student-portal-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["student-portal"] });
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
    queryKey: ["student-store-purchases"],
    queryFn: async () => {
      const response = await api.get<PurchaseHistoryItem[]>("/student-portal/store/purchases");
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}
