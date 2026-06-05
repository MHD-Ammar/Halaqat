"use client";

/**
 * useUserProfile Hook
 *
 * Fetches the current user's profile including their assigned circles.
 */

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

interface Circle {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  fullName?: string;
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
    queryKey: queryKeys.auth.profile(),
    queryFn: async () => {
      const res = await apiClient.get<ProfileResponse>("/auth/profile");
      const user = res.user;
      return {
        ...user,
        name: user.fullName ?? user.name,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
