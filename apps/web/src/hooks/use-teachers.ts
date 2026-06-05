"use client";

/**
 * useTeachers Hook
 *
 * Fetches the list of users with TEACHER role for dropdowns.
 */

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface Teacher {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

/**
 * Fetch all teachers (users with TEACHER role)
 * Used for teacher selection dropdowns in circle creation
 */
export function useTeachers() {
  return useQuery({
    queryKey: queryKeys.teachers.byRole(),
    queryFn: async () => {
      const data = await apiClient.get<Teacher[]>("/users", {
        params: { role: "TEACHER" },
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
