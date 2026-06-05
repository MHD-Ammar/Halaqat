"use client";

/**
 * useStudentPortal Hook
 *
 * Fetches the logged-in student's profile data using their linked studentId.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

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
    queryKey: queryKeys.studentPortal.dashboard(studentId ?? ""),
    queryFn: async () => {
      const data = await apiClient.get<StudentPortalData>(
        `/students/${studentId}/profile`,
      );
      return data;
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
  nextLevelXp: number;
  currentLevelXp: number;
  xpProgress: number; // 0-100
  xpToNextLevel: number;
  streakMultiplier: number;
  streakMultiplierLabel: string;
  streakMultiplierTier: number;
  nextMultiplierDaysNeeded: number | null;
  nextMultiplierLabel: string | null;
  streakShields: number;
  maxStreakShields: number;
  lastShieldUsedAt: string | null;
  activeTitle: string | null;
  activeAvatarFrame: string | null;
  activeEvent: {
    id: string;
    nameAr: string;
    descriptionAr: string | null;
    icon: string;
    themeColor: string;
    xpMultiplier: number;
    remainingHours: number;
    remainingDays: number;
    endsAt: string;
  } | null;
}

export interface ClaimLoginBonusResponse {
  claimed: boolean;
  xpAwarded?: number;
  newTotalXp?: number;
  levelUp?: boolean;
  newLevel?: number;
}

export interface LeagueTierSummary {
  id: number;
  rank: number;
  name: string;
  nameAr: string;
  icon: string;
}

export interface LastWeekLeagueResultResponse {
  result: "promoted" | "relegated" | "stayed";
  finalRank: number | null;
  weeklyXp: number;
  weekStart: string;
  fromTier: LeagueTierSummary;
  toTier: LeagueTierSummary;
}

/**
 * Fetch dashboard aggregation data for the student
 */
export function useStudentDashboard(campaignKey: string = "ramadan") {
  return useQuery({
    queryKey: queryKeys.studentPortal.dashboard(campaignKey),
    queryFn: async () => {
      const data = await apiClient.get<DashboardData>(
        `/student-portal/dashboard`,
        { params: { campaignKey } },
      );
      return data;
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
      const data = await apiClient.post<ClaimLoginBonusResponse>(
        `/student-portal/claim-login-bonus`,
      );
      return data;
    },
    onSuccess: (data) => {
      if (data.claimed) {
        queryClient.invalidateQueries({ queryKey: queryKeys.studentPortal.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.studentPortal.all });
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
      const data = await apiClient.patch(
        `/student-portal/recitation-reward/${recitationId}/seen`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentPortal.all });
    },
  });
}

export function useLastWeekLeagueResult() {
  return useQuery({
    queryKey: ["student-portal", "league", "last-week-result"] as const,
    queryFn: async () => {
      const data = await apiClient.get<LastWeekLeagueResultResponse | null>(
        "/student-portal/league/last-week-result",
      );
      return data;
    },
    staleTime: 30 * 1000,
  });
}

export function useMarkLastWeekLeagueResultSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const data = await apiClient.post<{ success: boolean }>(
        "/student-portal/league/last-week-result/seen",
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-portal", "league", "last-week-result"] as const });
      queryClient.invalidateQueries({ queryKey: queryKeys.studentPortal.leaderboard.league() });
    },
  });
}

export interface LiveFeedItem {
  id: string;
  emoji: string;
  type: "QUEST" | "ACHIEVEMENT" | "MILESTONE" | "LEVEL_UP" | "STREAK_MILESTONE" | "LEAGUE_PROMOTION";
  studentName: string;
  studentTitle: string | null;
  itemName: string;
  reactionCount: number;
  hasReacted: boolean;
}

/**
 * Fetch live social feed items
 */
export function useLiveFeed() {
  return useQuery({
    queryKey: ["student-portal", "live-feed"] as const,
    queryFn: async () => {
      const data = await apiClient.get<LiveFeedItem[]>(
        "/student-portal/live-feed",
      );
      return data;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
  });
}

/**
 * Toggle reaction on a feed item
 */
export function useToggleFeedReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (feedItemKey: string) => {
      return apiClient.post<{ reacted: boolean }>(
        `/student-portal/live-feed/${feedItemKey}/react`,
      );
    },
    onMutate: async (feedItemKey) => {
      await queryClient.cancelQueries({ queryKey: ["student-portal", "live-feed"] as const });
      const previousFeed = queryClient.getQueryData<LiveFeedItem[]>(["student-portal", "live-feed"]);

      if (previousFeed) {
        queryClient.setQueryData<LiveFeedItem[]>(
          ["student-portal", "live-feed"],
          previousFeed.map((item) => {
            if (item.id === feedItemKey) {
              return {
                ...item,
                hasReacted: !item.hasReacted,
                reactionCount: item.hasReacted ? item.reactionCount - 1 : item.reactionCount + 1,
              };
            }
            return item;
          }),
        );
      }

      return { previousFeed };
    },
    onError: (_err, _feedItemKey, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(["student-portal", "live-feed"], context.previousFeed);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["student-portal", "live-feed"] as const });
    },
  });
}
