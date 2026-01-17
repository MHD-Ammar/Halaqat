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

interface ProfileResponse {
  message: string;
  user: UserProfile;
}

/**
 * Fetch current user's profile
 */
export function useUserProfile() {
  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: async () => {
      const response = await api.get<ProfileResponse>("/auth/profile");
      // API returns { message, user } - extract user
      return response.data.user;
    },
    staleTime: 5 * 60 * 1000, // Profile rarely changes, cache for 5 minutes
    retry: 1, // Only retry once on failure
  });
}
