import { StoreItemType } from "@halaqat/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

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

export const adminStoreKeys = {
  all: ["admin", "store-items"] as const,
};

export function useAdminStoreItems() {
  return useQuery({
    queryKey: adminStoreKeys.all,
    queryFn: async () => {
      const { data } = await api.get<StoreItem[]>("/gamification/admin/store-items");
      return data;
    },
  });
}

export function useCreateStoreItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<StoreItem>) => {
      const { data } = await api.post<StoreItem>("/gamification/admin/store-items", dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminStoreKeys.all });
    },
  });
}

export function useUpdateStoreItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: Partial<StoreItem> }) => {
      const { data } = await api.put<StoreItem>(`/gamification/admin/store-items/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminStoreKeys.all });
    },
  });
}

export function useDeleteStoreItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/gamification/admin/store-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminStoreKeys.all });
    },
  });
}

export function useToggleStoreItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<StoreItem>(`/gamification/admin/store-items/${id}/toggle`, {});
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminStoreKeys.all });
    },
  });
}
