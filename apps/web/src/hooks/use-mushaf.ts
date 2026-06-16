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
  RecitationQuality,
  RecitationType,
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
 * Get mistakes for a student, optionally filtered by page number.
 *
 * @param latestOnly - when true (and a page is given) only the most recent
 *   recitation attempt's mistakes are returned. Used by the Mushaf overlay so
 *   re-reciting a page shows the latest attempt rather than every attempt
 *   merged together.
 */
export function useStudentMistakes(
  studentId: string,
  pageNumber?: number,
  latestOnly?: boolean,
) {
  return useQuery<RecitationMistake[]>({
    queryKey: [
      "mushaf",
      "mistakes",
      studentId,
      pageNumber ?? "all",
      latestOnly ? "latest" : "all-attempts",
    ],
    queryFn: async () => {
      const params: Record<string, number | boolean> = {};
      if (pageNumber) params.pageNumber = pageNumber;
      if (latestOnly && pageNumber) params.latestOnly = true;

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
 * A single recitation attempt on a page.
 */
export interface PageRecitationAttempt {
  recitationId: string | null;
  recitedAt: string;
  mistakeCount: number;
  mistakes: RecitationMistake[];
}

/**
 * Get the recitation history (all attempts, newest first) for a page.
 */
export function usePageRecitationHistory(
  studentId: string,
  pageNumber: number,
  enabled = true,
) {
  return useQuery<PageRecitationAttempt[]>({
    queryKey: ["mushaf", "history", studentId, pageNumber],
    queryFn: async () => {
      const response = await api.get(`/mushaf/history/${studentId}`, {
        params: { pageNumber },
      });
      return response.data;
    },
    enabled: enabled && !!studentId && pageNumber >= 1 && pageNumber <= 604,
    staleTime: 60 * 1000,
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
 * A single assessed page: its quality, type and the mistakes marked on it.
 */
export interface AssessPagePayload {
  pageNumber: number;
  quality: RecitationQuality;
  type: RecitationType;
  mistakes: {
    wordLocation: string;
    surahNumber: number;
    ayahNumber: number;
    wordPosition: number;
    mistakeType: MistakeType;
    notes?: string;
  }[];
}

interface AssessMushafResponse {
  recitations: unknown[];
  totalPointsAwarded: number;
  pageCount: number;
}

/**
 * Record a full Mushaf assessment in one call: creates a recitation per page
 * (awarding points / XP / achievements) AND saves the linked word-level
 * mistakes. This is what makes recording from the Mushaf produce the same
 * student achievement (إنجاز) and points as the recitation tab.
 */
export function useRecordMushafAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: {
      studentId: string;
      sessionId: string;
      pages: AssessPagePayload[];
    }) => {
      const response = await api.post<AssessMushafResponse>(
        "/progress/recitations/assess",
        dto,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Mistakes changed → refresh the highlight overlays.
      queryClient.invalidateQueries({
        queryKey: ["mushaf", "mistakes", variables.studentId],
      });
      // Page history changed → refresh the attempts panel.
      queryClient.invalidateQueries({
        queryKey: ["mushaf", "history", variables.studentId],
      });
      // Recitations / points / profile changed → refresh student-facing data.
      queryClient.invalidateQueries({
        queryKey: ["student", "profile", variables.studentId],
      });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["recitations"] });
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
