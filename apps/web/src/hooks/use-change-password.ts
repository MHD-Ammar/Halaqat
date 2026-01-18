"use client";

/**
 * useChangePassword Hook
 *
 * Mutation hook for changing user password.
 */

import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

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
      const response = await api.post<ChangePasswordResponse>("/auth/change-password", dto);
      return response.data;
    },
  });
}

export type { ChangePasswordDto };
