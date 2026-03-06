"use client";

/**
 * useStudentPortal Hook
 *
 * Fetches the logged-in student's profile data using their linked studentId.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { useUserProfile } from "./use-user-profile";

interface StudentStats {
  attendanceRate: number;
  totalRecitations: number;
  totalPoints: number;
}

interface Student {
  id: string;
  name: string;
  phone: string | null;
  totalPoints: number;
  circle: {
    id: string;
    name: string;
  } | null;
}

interface StudentPortalData {
  student: Student;
  stats: StudentStats;
}

/**
 * Fetch student portal data for the logged-in student user
 */
export function useStudentPortal() {
  const { data: userProfile, isLoading: isUserLoading } = useUserProfile();

  // The user profile should have a studentId for STUDENT role users
  const studentId = (userProfile as { studentId?: string } | undefined)
    ?.studentId;

  const query = useQuery({
    queryKey: ["student-portal", studentId],
    queryFn: async () => {
      const response = await api.get<StudentPortalData>(
        `/students/${studentId}/profile`,
      );
      return response.data;
    },
    enabled: !!studentId,
    staleTime: 30 * 1000,
  });

  return {
    ...query,
    isLoading: isUserLoading || query.isLoading,
    studentId,
  };
}

export type { StudentPortalData, Student, StudentStats };

// ── Gamification Hooks ───────────────────────────────────────────────

export interface DashboardData {
  streakCalendar: Record<string, boolean>;
  recentRecitations: {
    date: string;
    surah: string;
    quality: string;
    mistakesCount: number;
    type: string;
  }[];
  hasSubmittedToday: boolean;
  currentStreak: number;
  totalXp: number;
  currentLevel: number;
  hasUnseenRecitationReward: boolean;
  unseenRecitationReward: {
    id: string;
    quality: string;
    xpAwarded: number;
    surahName: string;
  } | null;
}

export interface ClaimLoginBonusResponse {
  claimed: boolean;
  xpAwarded?: number;
  newTotalXp?: number;
  levelUp?: boolean;
  newLevel?: number;
}

/**
 * Fetch dashboard aggregation data for the student
 */
export function useStudentDashboard(campaignKey: string = "ramadan") {
  return useQuery({
    queryKey: ["student-portal-dashboard", campaignKey],
    queryFn: async () => {
      const response = await api.get<DashboardData>(
        `/student-portal/dashboard`,
        { params: { campaignKey } },
      );
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Claim the daily sequence bonus package
 */
export function useClaimLoginBonus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ClaimLoginBonusResponse>(
        `/student-portal/claim-login-bonus`,
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.claimed) {
        queryClient.invalidateQueries({ queryKey: ["student-portal-dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["student-portal"] });
      }
    },
  });
}

/**
 * Mark a recitation reward as seen
 */
export function useMarkRecitationRewardSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recitationId: string) => {
      const response = await api.patch(
        `/student-portal/recitation-reward/${recitationId}/seen`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-portal-dashboard"] });
    },
  });
}
