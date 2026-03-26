"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

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
    queryKey: ["student-leaderboard", "circle"],
    queryFn: async () => {
      const response = await api.get<LeaderboardResponse>("/student-portal/leaderboard/circle");
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useMosqueLeaderboard() {
  return useQuery({
    queryKey: ["student-leaderboard", "mosque"],
    queryFn: async () => {
      const response = await api.get<LeaderboardResponse>("/student-portal/leaderboard/mosque");
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useLeagueLeaderboard() {
  return useQuery({
    queryKey: ["student-leaderboard", "league"],
    queryFn: async () => {
      const response = await api.get<LeagueLeaderboardResponse>("/student-portal/leaderboard/league");
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}
