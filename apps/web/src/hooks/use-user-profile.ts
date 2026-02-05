"use client";

/**
 * useUserProfile Hook
 *
 * Fetches the current user's profile including their assigned circles.
 */

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

interface Circle {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  mosqueId?: string;
  mosque?: {
    id: string;
    name: string;
    code: string;
  };
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
      // API returns { message, user } - extract user and transform fullName to name
      const user = response.data.user;
      return {
        ...user,
        name: (user as unknown as { fullName?: string }).fullName || user.name,
      };
    },
    staleTime: 5 * 60 * 1000, // Profile rarely changes, cache for 5 minutes
    retry: 1, // Only retry once on failure
  });
}
