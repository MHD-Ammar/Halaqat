"use client";

/**
 * useStudents Hook
 *
 * Fetches and manages students data with mutations for CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface Student {
  id: string;
  name: string;
  dateOfBirth?: string;
  guardianPhone?: string;
  guardianName?: string;
  circleId: string;
  circle?: {
    id: string;
    name: string;
  };
  totalPoints?: number;
  createdAt: string;
}

export interface CreateStudentDto {
  name: string;
  circleId: string;
  dateOfBirth?: string;
  guardianPhone?: string;
  guardianName?: string;
}

export interface StudentQueryParams {
  page?: number;
  limit?: number;
  circleId?: string;
}

export interface PaginatedStudents {
  data: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetch all students (Admin, paginated)
 */
export function useStudents(params?: StudentQueryParams) {
  return useQuery({
    queryKey: ["students", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.circleId) searchParams.set("circleId", params.circleId);
      
      const response = await api.get<PaginatedStudents>(`/students?${searchParams}`);
      return response.data;
    },
    refetchOnMount: "always",
  });
}

/**
 * Fetch students by circle
 */
export function useStudentsByCircle(circleId: string | undefined) {
  return useQuery({
    queryKey: ["students", "by-circle", circleId],
    queryFn: async () => {
      const response = await api.get<Student[]>(`/students/by-circle/${circleId}`);
      return response.data;
    },
    enabled: !!circleId,
    refetchOnMount: "always",
  });
}

/**
 * Create a new student
 */
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStudentDto) => {
      const response = await api.post<Student>("/students", data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate all student queries
      queryClient.invalidateQueries({ queryKey: ["students"] });
      // Also invalidate circle-specific student query
      queryClient.invalidateQueries({ queryKey: ["students", "by-circle", variables.circleId] });
      // Invalidate circles to update student counts
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    },
  });
}

/**
 * Delete a student
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
