"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  totalXp: number;
  currentLevel: number;
  activeTitle: string | null;
  activeAvatarFrame: string | null;
  weeklyXp?: number;
  promotionZone?: boolean;
  relegationZone?: boolean;
}

export interface LeaderboardResponse {
  students: LeaderboardEntry[];
  myRank: number;
}

export interface LeagueLeaderboardResponse extends LeaderboardResponse {
  leagueName: string;
  leagueNameAr: string;
  leagueIcon: string;
  leagueRank: number;
  weekEndsAt: string;
  promotionThreshold: number;
  relegationThreshold: number;
  myWeeklyXp: number;
}

export function useCircleLeaderboard() {
  return useQuery({
    queryKey: queryKeys.studentPortal.leaderboard.circle(),
    queryFn: async () => {
      const data = await apiClient.get<LeaderboardResponse>("/student-portal/leaderboard/circle");
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useMosqueLeaderboard() {
  return useQuery({
    queryKey: queryKeys.studentPortal.leaderboard.mosque(),
    queryFn: async () => {
      const data = await apiClient.get<LeaderboardResponse>("/student-portal/leaderboard/mosque");
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useLeagueLeaderboard() {
  return useQuery({
    queryKey: queryKeys.studentPortal.leaderboard.league(),
    queryFn: async () => {
      const data = await apiClient.get<LeagueLeaderboardResponse>("/student-portal/leaderboard/league");
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}
