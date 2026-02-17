import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

// --- Types ---
export interface RamadanCircle {
  id: string;
  name: string;
}

export interface RamadanStudent {
  id: string;
  name: string;
}

export interface RamadanStudentInfo {
  id: string;
  name: string;
  currentStreak: number;
  lastSubmissionDate: string | null;
}

export interface SubmitRamadanDto {
  studentId: string;
  submissionData: Record<string, any>;
}

export interface RamadanLeaderboardEntry {
  studentId: string;
  name: string;
  totalXp: number;
  streak: number;
}

// --- Keys ---
export const ramadanKeys = {
  all: ["ramadan"] as const,
  circles: (mosqueId: string) => [...ramadanKeys.all, "circles", mosqueId] as const,
  students: (circleId: string) => [...ramadanKeys.all, "students", circleId] as const,
  studentInfo: (studentId: string) =>
    [...ramadanKeys.all, "student-info", studentId] as const,
  leaderboard: (mosqueId: string) =>
    [...ramadanKeys.all, "leaderboard", mosqueId] as const,
};

// --- Hooks ---

/**
 * Get circles for a mosque (Public)
 */
export function useRamadanCircles(mosqueId?: string) {
  return useQuery({
    queryKey: ramadanKeys.circles(mosqueId || "default"),
    queryFn: async () => {
      // If no mosqueId, API defaults to first one. We assume 'default' key for client cache if undefined.
      const params = mosqueId ? { mosqueId } : {};
      const { data } = await api.get<RamadanCircle[]>("/ramadan/circles", {
        params,
      });
      return data;
    },
  });
}

/**
 * Get students for a circle (Public)
 */
export function useRamadanStudents(circleId: string | null) {
  return useQuery({
    queryKey: ramadanKeys.students(circleId!),
    queryFn: async () => {
      const { data } = await api.get<RamadanStudent[]>(
        `/ramadan/students/${circleId}`,
      );
      return data;
    },
    enabled: !!circleId,
  });
}

/**
 * Get student info & streak (Public)
 */
export function useRamadanStudentInfo(studentId: string | null) {
  return useQuery({
    queryKey: ramadanKeys.studentInfo(studentId!),
    queryFn: async () => {
      const { data } = await api.get<RamadanStudentInfo>(
        `/ramadan/student-info/${studentId}`,
      );
      return data;
    },
    enabled: !!studentId,
  });
}

/**
 * Submit daily challenge
 */
export function useRamadanSubmit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: SubmitRamadanDto) => {
      const { data } = await api.post("/ramadan/submit", dto);
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate student info to update streak
      queryClient.invalidateQueries({
        queryKey: ramadanKeys.studentInfo(variables.studentId),
      });
      // Invalidate leaderboard
      queryClient.invalidateQueries({
        queryKey: ["ramadan", "leaderboard"],
      });
    },
  });
}

/**
 * Get Leaderboard
 */
export function useRamadanLeaderboard(mosqueId?: string) {
  return useQuery({
    queryKey: ramadanKeys.leaderboard(mosqueId || "default"),
    queryFn: async () => {
      const params = mosqueId ? { mosqueId } : {};
      const { data } = await api.get<RamadanLeaderboardEntry[]>(
        "/ramadan/leaderboard",
        { params },
      );
      return data;
    },
  });
}
