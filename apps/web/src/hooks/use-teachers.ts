"use client";

/**
 * useTeachers Hook
 *
 * Fetches the list of users with TEACHER role for dropdowns.
 */

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

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
    queryKey: ["users", "teachers"],
    queryFn: async () => {
      const response = await api.get<Teacher[]>("/users", {
        params: { role: "TEACHER" },
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
