"use client";

/**
 * useChangePassword Hook
 *
 * Mutation hook for changing user password.
 */

import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  message: string;
}

/**
 * Hook for changing user password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (dto: ChangePasswordDto) => {
      const data = await apiClient.post<ChangePasswordResponse>("/auth/change-password", dto);
      return data;
    },
  });
}

export type { ChangePasswordDto };
