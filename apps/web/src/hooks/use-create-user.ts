"use client";

/**
 * useCreateUser Hook
 *
 * Mutation hook for creating new user accounts with any role.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

interface CreateUserData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string;
  mosqueId?: string;
}

interface CreateUserResponse {
  message: string;
  data: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    mosqueId?: string;
  };
}

/**
 * Create a new user account with specified role
 * POST /users with role specified
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateUserData) => {
      const res = await apiClient.post<CreateUserResponse>("/users", dto);
      return res;
    },
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.byRole() });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats.all });
    },
  });
}
