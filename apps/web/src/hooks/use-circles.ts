"use client";

/**
 * useCircles Hook
 *
 * Fetches and manages circles data with mutations for CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface Circle {
  id: string;
  name: string;
  description?: string;
  teacherId?: string;
  teacher?: {
    id: string;
    fullName: string;
  };
  studentCount?: number;
  createdAt: string;
  gender: "MALE" | "FEMALE";
}

export interface CreateCircleDto {
  name: string;
  description?: string;
  gender: "MALE" | "FEMALE";
  teacherId: string;
}

export interface UpdateCircleDto extends Partial<CreateCircleDto> {}


/**
 * Fetch all circles (Admin)
 */
export function useCircles(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["circles"],
    queryFn: async () => {
      const response = await api.get<Circle[]>("/circles");
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    ...options,
  });
}

/**
 * Fetch teacher's assigned circles
 */
export function useMyCircles(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["circles", "my-list"],
    queryFn: async () => {
      const response = await api.get<Circle[]>("/circles/my-list");
      return response.data;
    },
    refetchOnMount: "always",
    ...options,
  });
}

/**
 * Create a new circle
 */
export function useCreateCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCircleDto) => {
      const response = await api.post<Circle>("/circles", data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate circles list to refetch
      queryClient.invalidateQueries({ queryKey: ["circles"] });
      // Invalidate user profile to update my-circle list
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    },
  });
}

/**
 * Update a circle
 */
export function useUpdateCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCircleDto }) => {
      const response = await api.patch<Circle>(`/circles/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate circles list to refetch
      queryClient.invalidateQueries({ queryKey: ["circles"] });
      // Invalidate specific circle details
      queryClient.invalidateQueries({ queryKey: ["circles", data.id] });
      // Invalidate user profile if needed
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    },
  });
}

/**
 * Delete a circle
 */
export function useDeleteCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/circles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    },
  });
}
