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

export function useLastWeekLeagueResult() {
  return useQuery({
    queryKey: ["student-portal", "league", "last-week-result"],
    queryFn: async () => {
      const response = await api.get<LastWeekLeagueResultResponse | null>(
        "/student-portal/league/last-week-result",
      );
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useMarkLastWeekLeagueResultSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ success: boolean }>(
        "/student-portal/league/last-week-result/seen",
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-portal", "league", "last-week-result"] });
      queryClient.invalidateQueries({ queryKey: ["student-leaderboard", "league"] });
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
    queryKey: ["student-portal", "live-feed"],
    queryFn: async () => {
      const res = await api.get<LiveFeedItem[]>(
        "/student-portal/live-feed",
      );
      return res.data;
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
      const res = await api.post<{ reacted: boolean }>(
        `/student-portal/live-feed/${feedItemKey}/react`,
      );
      return res.data;
    },
    onMutate: async (feedItemKey) => {
      await queryClient.cancelQueries({ queryKey: ["student-portal", "live-feed"] });
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
      queryClient.invalidateQueries({ queryKey: ["student-portal", "live-feed"] });
    },
  });
}
