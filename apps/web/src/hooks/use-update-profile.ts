"use client";

/**
 * useUpdateProfile Hook
 *
 * Mutation hook for updating user profile.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";

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
      const response = await api.patch<UpdateProfileResponse>("/auth/profile", dto);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user profile query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    },
  });
}

export type { UpdateProfileDto };
