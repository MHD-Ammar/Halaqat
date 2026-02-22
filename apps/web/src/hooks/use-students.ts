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
  dob?: string;
  phone?: string;
  address?: string;
  notes?: string;
  guardianPhone?: string;
  guardianName?: string;
  circleId: string;
  circle?: {
    id: string;
    name: string;
  };
  totalPoints?: number;
  totalXp?: number;
  currentLevel?: number;
  currentStreak?: number;
  maxStreak?: number;
  username?: string;
  createdAt: string;
}

export interface CreateStudentDto {
  name: string;
  circleId: string;
  dob?: string;
  phone?: string;
  address?: string;
  notes?: string;
  guardianPhone?: string;
  guardianName?: string;
}

export interface StudentQueryParams {
  page?: number;
  limit?: number;
  circleId?: string;
  search?: string;
}

export interface PaginatedStudents {
  data: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Raw shape returned by the backend */
interface BackendPaginatedResponse {
  data: Student[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
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
      if (params?.search) searchParams.set("search", params.search);
      
      const response = await api.get<BackendPaginatedResponse>(`/students?${searchParams}`);
      const raw = response.data;

      // Normalize backend meta shape into flat PaginatedStudents
      return {
        data: raw.data,
        total: raw.meta.total,
        page: raw.meta.page,
        limit: raw.meta.limit,
        totalPages: raw.meta.lastPage,
      } as PaginatedStudents;
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
      // Invalidate today's session to show new student
      queryClient.invalidateQueries({ queryKey: ["today-session"] });
    },
  });
}

/**
 * DTO for updating a student
 */
export interface UpdateStudentDto {
  name?: string;
  phone?: string;
  dob?: string;
  address?: string;
  notes?: string;
  guardianName?: string;
  guardianPhone?: string;
  circleId?: string;
}

/**
 * Update a student
 * Calls PATCH /students/:id
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateStudentDto & { id: string }) => {
      const response = await api.patch<Student>(`/students/${id}`, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate all student queries
      queryClient.invalidateQueries({ queryKey: ["students"] });
      // Also invalidate circle-specific if circleId provided
      if (variables.circleId) {
        queryClient.invalidateQueries({
          queryKey: ["students", "by-circle", variables.circleId],
        });
      }
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

export interface StudentCredentials {
  username: string;
  password: string;
}

/**
 * Generate credentials for a student
 */
export function useGenerateCredentials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<StudentCredentials>(`/students/${id}/generate-credentials`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
