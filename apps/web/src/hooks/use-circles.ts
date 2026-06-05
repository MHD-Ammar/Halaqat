"use client";

/**
 * useCircles Hook
 *
 * Circles CRUD for the admin panel. Standard factory hooks plus two
 * hand-written list queries (all circles vs. teacher's circles) that need
 * different cache keys and stale-time settings.
 *
 * All exported names are unchanged from the original.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

import { createResourceHooks } from "./factories/create-resource-hooks";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Circle {
  id: string;
  name: string;
  description?: string;
  teacherId?: string;
  teacher?: { id: string; fullName: string };
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

// ── Factory (delete only; other mutations need custom invalidation) ─────────

const _circleHooks = createResourceHooks<Circle, CreateCircleDto, UpdateCircleDto>({
  baseUrl: "/circles",
  keys: queryKeys.circles,
  invalidateOn: {
    remove: [queryKeys.circles.all],
  },
});

// ── All circles (admin) ────────────────────────────────────────────────────

export function useCircles(options: { enabled?: boolean } = {}) {
  return useQuery<Circle[]>({
    queryKey: queryKeys.circles.list(),
    queryFn: () => apiClient.get<Circle[]>("/circles"),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    ...options,
  });
}

// ── Teacher's assigned circles ─────────────────────────────────────────────

export function useMyCircles(options: { enabled?: boolean } = {}) {
  return useQuery<Circle[]>({
    queryKey: queryKeys.circles.myList(),
    queryFn: () => apiClient.get<Circle[]>("/circles/my-list"),
    refetchOnMount: "always",
    ...options,
  });
}

// ── Create ─────────────────────────────────────────────────────────────────

export function useCreateCircle() {
  const qc = useQueryClient();
  return useMutation<Circle, Error, CreateCircleDto>({
    mutationFn: (data) => apiClient.post<Circle>("/circles", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.circles.all });
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

// ── Update ─────────────────────────────────────────────────────────────────

export function useUpdateCircle() {
  const qc = useQueryClient();
  return useMutation<Circle, Error, { id: string; data: UpdateCircleDto }>({
    mutationFn: ({ id, data }) =>
      apiClient.patch<Circle>(`/circles/${id}`, data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.circles.all });
      qc.invalidateQueries({ queryKey: queryKeys.circles.detail(data.id) });
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

// ── Delete ─────────────────────────────────────────────────────────────────

export const useDeleteCircle = _circleHooks.useRemove;
