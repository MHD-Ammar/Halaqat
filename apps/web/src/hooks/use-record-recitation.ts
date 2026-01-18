"use client";

/**
 * useRecordRecitation Hook
 *
 * Mutation hook for recording bulk page recitations.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { RecitationType, RecitationQuality } from "@halaqat/types";

/**
 * Single page recitation detail
 */
export interface PageDetail {
  pageNumber: number;
  quality: RecitationQuality;
  type: RecitationType;
}

/**
 * Bulk recitation request DTO
 */
export interface BulkRecitationDto {
  studentId: string;
  sessionId: string;
  details: PageDetail[];
}

/**
 * Bulk recitation response
 */
interface BulkRecitationResponse {
  recitations: unknown[];
  totalPointsAwarded: number;
  pageCount: number;
}

/**
 * Hook for recording bulk page recitations
 */
export function useRecordRecitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: BulkRecitationDto) => {
      const response = await api.post<BulkRecitationResponse>(
        "/progress/recitations/bulk",
        dto
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate student-related queries
      queryClient.invalidateQueries({ queryKey: ["student", "profile", variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["recitations"] });
    },
  });
}

export type { BulkRecitationResponse as RecordRecitationResult };
