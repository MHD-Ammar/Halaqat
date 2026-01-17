"use client";

/**
 * useRecordRecitation Hook
 *
 * Mutation hook for recording a student's recitation.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RecitationType, RecitationQuality } from "@halaqat/types";
import api from "@/lib/api";

interface RecordRecitationDto {
  studentId: string;
  sessionId: string;
  surahId: number;
  startVerse: number;
  endVerse: number;
  type: RecitationType;
  quality: RecitationQuality;
  mistakesCount?: number;
  notes?: string;
}

interface RecitationResponse {
  id: string;
  studentId: string;
  sessionId: string;
  surahId: number;
  startVerse: number;
  endVerse: number;
  type: RecitationType;
  quality: RecitationQuality;
  mistakesCount: number;
}

/**
 * Record a new recitation
 */
export function useRecordRecitation(circleId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecordRecitationDto) => {
      const response = await api.post<RecitationResponse>(
        "/progress/recitations",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate session query to refresh attendance and points
      if (circleId) {
        queryClient.invalidateQueries({
          queryKey: ["session", "today", circleId],
        });
      }
    },
  });
}

export type { RecordRecitationDto };
