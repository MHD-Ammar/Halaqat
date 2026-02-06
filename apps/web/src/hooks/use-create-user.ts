"use client";

/**
 * useCreateUser Hook
 *
 * Mutation hook for creating new user accounts with any role.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

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
    mutationFn: async (data: CreateUserData) => {
      const response = await api.post<CreateUserResponse>("/users", data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", "teachers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "teachers"] });
    },
  });
}
