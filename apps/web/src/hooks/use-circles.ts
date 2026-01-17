"use client";

/**
 * useCircles Hook
 *
 * Fetches and manages circles data with mutations for CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Circle {
  id: string;
  name: string;
  description?: string;
  teacherId?: string;
  teacher?: {
    id: string;
    fullName: string;
  };
  _count?: {
    students: number;
  };
  createdAt: string;
}

export interface CreateCircleDto {
  name: string;
  description?: string;
  gender: "MALE" | "FEMALE";
  teacherId: string;
}

/**
 * Fetch all circles (Admin)
 */
export function useCircles() {
  return useQuery({
    queryKey: ["circles"],
    queryFn: async () => {
      const response = await api.get<Circle[]>("/circles");
      return response.data;
    },
  });
}

/**
 * Fetch teacher's assigned circles
 */
export function useMyCircles() {
  return useQuery({
    queryKey: ["circles", "my-list"],
    queryFn: async () => {
      const response = await api.get<Circle[]>("/circles/my-list");
      return response.data;
    },
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
