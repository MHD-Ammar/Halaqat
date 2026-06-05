"use client";

/**
 * useStudents Hook
 *
 * Students CRUD + credential generation for the admin panel.
 * Standard mutations go through the factory; the paginated list query is
 * hand-written because it has a custom backend response shape.
 *
 * All exported names are unchanged from the original.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

import { createResourceHooks } from "./factories/create-resource-hooks";

// ── Types ──────────────────────────────────────────────────────────────────

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
  circle?: { id: string; name: string };
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

interface BackendPaginatedResponse {
  data: Student[];
  meta: { total: number; page: number; lastPage: number; limit: number };
}

export interface StudentCredentials {
  username: string;
  password: string;
}

// ── Factory (used for delete only — other mutations need custom invalidations)

const _studentHooks = createResourceHooks<
  Student,
  CreateStudentDto,
  UpdateStudentDto,
  StudentQueryParams
>({
  baseUrl: "/students",
  keys: queryKeys.students,
  invalidateOn: {
    remove: [queryKeys.students.all],
  },
});

// ── Paginated admin list (custom response shape) ───────────────────────────

export function useStudents(params?: StudentQueryParams) {
  return useQuery<PaginatedStudents>({
    queryKey: queryKeys.students.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.circleId) searchParams.set("circleId", params.circleId);
      if (params?.search) searchParams.set("search", params.search);

      const raw = await apiClient.get<BackendPaginatedResponse>(
        `/students?${searchParams}`,
      );
      return {
        data: raw.data,
        total: raw.meta.total,
        page: raw.meta.page,
        limit: raw.meta.limit,
        totalPages: raw.meta.lastPage,
      };
    },
    refetchOnMount: "always",
  });
}

// ── By-circle list ─────────────────────────────────────────────────────────

export function useStudentsByCircle(circleId: string | undefined) {
  return useQuery<Student[]>({
    queryKey: queryKeys.students.byCircle(circleId ?? ""),
    queryFn: () => apiClient.get<Student[]>(`/students/by-circle/${circleId}`),
    enabled: !!circleId,
    refetchOnMount: "always",
  });
}

// ── Create ─────────────────────────────────────────────────────────────────

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation<Student, Error, CreateStudentDto>({
    mutationFn: (data) => apiClient.post<Student>("/students", data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all });
      qc.invalidateQueries({
        queryKey: queryKeys.students.byCircle(variables.circleId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.circles.all });
      qc.invalidateQueries({ queryKey: queryKeys.sessions.all });
    },
  });
}

// ── Update ─────────────────────────────────────────────────────────────────

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation<Student, Error, UpdateStudentDto & { id: string }>({
    mutationFn: ({ id, ...data }) =>
      apiClient.patch<Student>(`/students/${id}`, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all });
      if (variables.circleId) {
        qc.invalidateQueries({
          queryKey: queryKeys.students.byCircle(variables.circleId),
        });
      }
    },
  });
}

// ── Delete ─────────────────────────────────────────────────────────────────

export const useDeleteStudent = _studentHooks.useRemove;

// ── Generate credentials ───────────────────────────────────────────────────

export function useGenerateCredentials() {
  const qc = useQueryClient();
  return useMutation<StudentCredentials, Error, string>({
    mutationFn: (id) =>
      apiClient.post<StudentCredentials>(`/students/${id}/generate-credentials`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });
}
