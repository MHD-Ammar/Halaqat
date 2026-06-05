import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Campaign, CreateCampaignDto, UpdateCampaignDto } from "@/types/campaign";

export const campaignKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignKeys.all, "list"] as const,
  detail: (id: string) => [...campaignKeys.all, "detail", id] as const,
};

export function useCampaigns() {
  return useQuery({
    queryKey: queryKeys.campaigns.list(),
    queryFn: async () => {
      const data = await apiClient.get<Campaign[]>("/admin/campaigns");
      return data;
    },
  });
}

// Fetch a single campaign for the edit form
export function useCampaign(id: string) {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(id),
    queryFn: async () => {
      // We can fetch the list and find the specific one, or if there's an API, use that.
      // Since the backend API didn't have a GET /admin/campaigns/:id, we fetch all.
      const data = await apiClient.get<Campaign[]>("/admin/campaigns");
      const campaign = data.find((c) => c.id === id);
      if (!campaign) throw new Error("Campaign not found");
      return campaign;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateCampaignDto) => {
      const data = await apiClient.post<Campaign>("/admin/campaigns", dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.list() });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateCampaignDto }) => {
      const data = await apiClient.put<Campaign>(`/admin/campaigns/${id}`, dto);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.list() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.id) });
    },
  });
}

export function useResetStreaks() {
  return useMutation({
    mutationFn: async (dto?: { mosqueId?: string; circleId?: string }) => {
      const data = await apiClient.post<{ success: boolean; modifiedCount: number }>(
        "/daily-challenge/campaigns/reset-streaks",
        dto || {}
      );
      return data;
    },
  });
}
