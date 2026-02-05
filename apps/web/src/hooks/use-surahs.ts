"use client";

/**
 * useSurahs Hook
 *
 * Fetches the list of Surahs from the curriculum API.
 */

import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

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
    queryKey: ["curriculum", "surahs"],
    queryFn: async () => {
      const response = await api.get<Surah[]>("/curriculum/surahs");
      return response.data;
    },
    staleTime: 24 * 60 * 60 * 1000, // Surahs never change, cache for 24 hours
  });
}

export type { Surah };
