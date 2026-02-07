"use client";

/**
 * Users Hooks
 *
 * Fetches and manages users for admin panel
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  mosqueId?: string;
  createdAt: string;
}

/**
 * DTO for updating a user
 */
export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
}

/**
 * Hook to list all users (Admin only)
 */
export function useUsers(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get<User[]>("/users");
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    ...options,
  });
}

/**
 * Hook to update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await api.patch<{ data: User }>(
        `/users/${userId}/role`,
        { role }
      );
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/**
 * Hook to update user (Admin only)
 * Calls PATCH /users/:id
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateUserDto & { id: string }) => {
      const response = await api.patch<{ message: string; data: User }>(
        `/users/${id}`,
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/**
 * Hook to delete user (Admin only)
 * Calls DELETE /users/:id
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/**
 * Hook to reset user password (Admin only)
 * Calls PATCH /users/:id/reset-password
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async ({
      userId,
      password,
    }: {
      userId: string;
      password: string;
    }) => {
      await api.patch(`/users/${userId}/reset-password`, { password });
    },
  });
}

