"use client";

/**
 * useCircle Hook
 *
 * Fetches a single circle's details with students list.
 */

import { Gender } from "@halaqat/types";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface CircleStudent {
  id: string;
  name: string;
  totalPoints?: number;
}

export interface CircleDetails {
  id: string;
  name: string;
  description?: string;
  location?: string;
  gender: Gender;
  teacher?: {
    id: string;
    fullName: string;
    email: string;
  };
  students: CircleStudent[];
  _count?: {
    students: number;
  };
  createdAt: string;
}

/**
 * Fetch a single circle's details by ID
 */
export function useCircle(id?: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["circles", id],
    queryFn: async () => {
      if (!id || id === "undefined") {
        throw new Error("Invalid circle ID");
      }
      const response = await api.get<CircleDetails>(`/circles/${id}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    ...options,
    enabled: (options.enabled ?? true) && !!id && id !== "undefined",
  });
}
