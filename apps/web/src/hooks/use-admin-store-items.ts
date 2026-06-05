/**
 * Admin Store Items Hooks
 *
 * CRUD + toggle for gamification store items.
 * Migrated to factory + apiClient + central query-key registry.
 *
 * All exported names are unchanged from the original.
 */

import { StoreItemType } from "@halaqat/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

import { createResourceHooks } from "./factories/create-resource-hooks";

// ── Types ──────────────────────────────────────────────────────────────────

export interface StoreItem {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  type: StoreItemType;
  xpCost: number;
  rewardValue: string;
  icon: string;
  isActive: boolean;
  maxPerStudent: number | null;
  stock: number | null;
  minLevel: number;
  createdAt: string;
}

// ── Factory ────────────────────────────────────────────────────────────────

const storeHooks = createResourceHooks<StoreItem, Partial<StoreItem>, Partial<StoreItem>>({
  baseUrl: "/gamification/admin/store-items",
  keys: queryKeys.adminStoreItems,
});

export const useAdminStoreItems = storeHooks.useList;
export const useCreateStoreItem = storeHooks.useCreate;
export const useUpdateStoreItem = storeHooks.useUpdate;
export const useDeleteStoreItem = storeHooks.useRemove;

// ── Toggle (non-CRUD, stays hand-written) ─────────────────────────────────

export function useToggleStoreItem() {
  const qc = useQueryClient();
  return useMutation<StoreItem, Error, string>({
    mutationFn: (id) =>
      apiClient.post<StoreItem>(
        `/gamification/admin/store-items/${id}/toggle`,
        {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminStoreItems.all });
    },
  });
}
