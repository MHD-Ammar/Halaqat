"use client";

/**
 * useMushaf Hooks
 *
 * React Query hooks for:
 * 1. Fetching Mushaf pages from QuraniHub (with localStorage cache)
 * 2. Reading/writing student Mushaf state from our backend
 * 3. Reading/writing recitation mistakes from our backend
 */

import type {
  MistakeType,
  MushafPage,
  RecitationMistakeDto,
} from "@halaqat/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { fetchMushafPage, prefetchAdjacentPages } from "@/services/qurani.service";

// ── QuraniHub Page Hooks ──────────────────────────────────────────

/**
 * Fetch a single Mushaf page with word-level data.
 * Uses QuraniHub API with localStorage cache for offline PWA support.
 *
 * @param pageNumber - Page number (1-604)
 */
export function useMushafPage(pageNumber: number) {
  return useQuery<MushafPage>({
    queryKey: ["mushaf", "page", pageNumber],
    queryFn: () => fetchMushafPage(pageNumber),
    enabled: pageNumber >= 1 && pageNumber <= 604,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours stale time (data rarely changes)
    gcTime: Infinity, // Never garbage-collect Quran data
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}

// ── Backend: Mushaf State Hooks ───────────────────────────────────

interface MushafState {
  id: string;
  studentId: string;
  lastPageNumber: number;
  lastSurahNumber: number | null;
  lastAyahNumber: number | null;
}

/**
 * Get the current student's Mushaf state (last reading position).
 */
export function useMyMushafState() {
  return useQuery<MushafState>({
    queryKey: ["mushaf", "state", "me"],
    queryFn: async () => {
      const response = await api.get("/mushaf/state");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get a specific student's Mushaf state (teacher view).
 */
export function useStudentMushafState(studentId: string) {
  return useQuery<MushafState>({
    queryKey: ["mushaf", "state", studentId],
    queryFn: async () => {
      const response = await api.get(`/mushaf/state/${studentId}`);
      return response.data;
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Update the current student's Mushaf state.
 * Used for auto-saving page position on navigation.
 */
export function useUpdateMyMushafState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: {
      pageNumber: number;
      surahNumber?: number;
      ayahNumber?: number;
    }) => {
      const response = await api.patch("/mushaf/state", dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mushaf", "state", "me"] });
    },
  });
}

/**
 * Update a student's Mushaf state (teacher access).
 */
export function useUpdateStudentMushafState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      ...dto
    }: {
      studentId: string;
      pageNumber: number;
      surahNumber?: number;
      ayahNumber?: number;
    }) => {
      const response = await api.patch(`/mushaf/state/${studentId}`, dto);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["mushaf", "state", variables.studentId],
      });
    },
  });
}

// ── Backend: Mistake Hooks ────────────────────────────────────────

interface RecitationMistake {
  id: string;
  recitationId: string | null;
  studentId: string;
  wordLocation: string;
  pageNumber: number;
  surahNumber: number;
  ayahNumber: number;
  wordPosition: number;
  mistakeType: MistakeType;
  notes: string | null;
  createdAt: string;
}

/**
 * Get all mistakes for a student, optionally filtered by page number.
 */
export function useStudentMistakes(
  studentId: string,
  pageNumber?: number
) {
  return useQuery<RecitationMistake[]>({
    queryKey: ["mushaf", "mistakes", studentId, pageNumber ?? "all"],
    queryFn: async () => {
      const params: Record<string, number> = {};
      if (pageNumber) params.pageNumber = pageNumber;

      const response = await api.get(`/mushaf/mistakes/${studentId}`, {
        params,
      });
      return response.data;
    },
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Bulk-create word-level mistakes (teacher assessor).
 */
export function useBulkCreateMistakes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: {
      recitationId?: string;
      studentId: string;
      mistakes: RecitationMistakeDto[];
    }) => {
      const response = await api.post("/mushaf/mistakes/bulk", dto);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all mistake queries for this student
      queryClient.invalidateQueries({
        queryKey: ["mushaf", "mistakes", variables.studentId],
      });
    },
  });
}

/**
 * Delete a single mistake.
 */
export function useDeleteMistake() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mistakeId: string) => {
      const response = await api.delete(`/mushaf/mistakes/${mistakeId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mushaf", "mistakes"],
      });
    },
  });
}

// ── Utility: Pre-fetcher ──────────────────────────────────────────

/**
 * Effect helper: Pre-fetch adjacent pages when current page changes.
 * Call this inside useEffect with the current page number.
 */
export function triggerPrefetch(currentPage: number): void {
  prefetchAdjacentPages(currentPage);
}
