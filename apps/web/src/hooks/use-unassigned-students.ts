"use client";

/**
 * useUnassignedStudents Hook
 *
 * Fetches students that are not assigned to any circle.
 * Supports search filtering.
 */

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

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
    queryKey: queryKeys.students.unassigned(search),
    queryFn: async () => {
      const data = await apiClient.get<UnassignedStudent[]>("/students/unassigned", {
        params: search ? { search } : undefined,
      });
      return data;
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
}
