"use client";

/**
 * useUpdateProfile Hook
 *
 * Mutation hook for updating user profile.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

interface UpdateProfileDto {
  fullName?: string;
  phoneNumber?: string;
}

interface UpdateProfileResponse {
  message: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

/**
 * Hook for updating user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: UpdateProfileDto) => {
      const data = await apiClient.patch<UpdateProfileResponse>("/auth/profile", dto);
      return data;
    },
    onSuccess: () => {
      // Invalidate user profile query to refetch updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
    },
  });
}

export type { UpdateProfileDto };
