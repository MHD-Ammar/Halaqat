"use client";

/**
 * useSurahsWithPages Hook
 *
 * Fetches all surahs with page ranges for client-side lookup.
 */

import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

export interface SurahWithPages {
  id: number;
  number: number;
  nameArabic: string;
  nameEnglish: string;
  startPage: number;
  endPage: number;
}

/**
 * Fetch all surahs with page ranges
 */
export function useSurahsWithPages() {
  return useQuery({
    queryKey: ["surahs", "with-pages"],
    queryFn: async () => {
      const response = await api.get<SurahWithPages[]>("/curriculum/surahs-with-pages");
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // Cache for 1 hour - this data never changes
  });
}

/**
 * Client-side helper to find surah by page number
 */
export function findSurahForPage(
  surahs: SurahWithPages[] | undefined,
  pageNumber: number
): SurahWithPages | undefined {
  if (!surahs) return undefined;
  return surahs.find(
    (s) => pageNumber >= s.startPage && pageNumber <= s.endPage
  );
}
