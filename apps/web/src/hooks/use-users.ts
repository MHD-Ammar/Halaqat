"use client";

/**
 * Users Hooks
 *
 * Fetches and manages users for admin panel
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

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

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Hook to list all users (Admin only)
 */
export function useUsers(options: { page?: number; limit?: number; role?: string; enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(options),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (options.page) searchParams.set("page", String(options.page));
      if (options.limit) searchParams.set("limit", String(options.limit));
      if (options.role) searchParams.set("role", options.role);

      const data = await apiClient.get<{ 
        data: User[]; 
        meta: { 
          total: number; 
          page: number; 
          lastPage: number; 
          limit: number; 
        } 
      }>(`/users?${searchParams}`);
      const raw = data;

      return {
        data: raw.data,
        total: raw.meta.total,
        page: raw.meta.page,
        limit: raw.meta.limit,
        totalPages: raw.meta.lastPage,
      } as PaginatedUsers;
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
      const data = await apiClient.patch<{ data: User }>(
        `/users/${userId}/role`,
        { role }
      );
      return data.data;
    },
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
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
    mutationFn: async ({ id, ...dto }: UpdateUserDto & { id: string }) => {
      const res = await apiClient.patch<{ message: string; data: User }>(
        `/users/${id}`,
        dto
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
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
      await apiClient.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
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
      await apiClient.patch(`/users/${userId}/reset-password`, { password });
    },
  });
}

