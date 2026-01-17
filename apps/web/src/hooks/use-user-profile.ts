"use client";

/**
 * useUserProfile Hook
 *
 * Fetches the current user's profile including their assigned circles.
 */

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface Circle {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  circles?: Circle[];
}

/**
 * Fetch current user's profile
 */
export function useUserProfile() {
  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: async () => {
      const response = await api.get<UserProfile>("/auth/profile");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Profile rarely changes, cache for 5 minutes
  });
}
