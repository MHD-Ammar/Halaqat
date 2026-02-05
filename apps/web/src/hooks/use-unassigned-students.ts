"use client";

/**
 * useUnassignedStudents Hook
 *
 * Fetches students that are not assigned to any circle.
 * Supports search filtering.
 */

import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

export interface UnassignedStudent {
  id: string;
  name: string;
  guardianName?: string;
  guardianPhone?: string;
}

/**
 * Fetch unassigned students (no circle)
 * @param search - Optional search term to filter by name
 */
export function useUnassignedStudents(search?: string) {
  return useQuery({
    queryKey: ["students", "unassigned", search],
    queryFn: async () => {
      const response = await api.get<UnassignedStudent[]>("/students/unassigned", {
        params: search ? { search } : undefined,
      });
      return response.data;
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
}
