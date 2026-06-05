"use client";

/**
 * useSurahs Hook
 *
 * Fetches the list of Surahs from the curriculum API.
 */

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

interface Surah {
  id: number;
  number: number;
  nameArabic: string;
  nameEnglish: string;
  verseCount: number;
}

/**
 * Fetch all Surahs
 */
export function useSurahs() {
  return useQuery({
    queryKey: queryKeys.curriculum.surahs(),
    queryFn: async () => {
      const data = await apiClient.get<Surah[]>("/curriculum/surahs");
      return data;
    },
    staleTime: 24 * 60 * 60 * 1000, // Surahs never change, cache for 24 hours
  });
}

export type { Surah };
