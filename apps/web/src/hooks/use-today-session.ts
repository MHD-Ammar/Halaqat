"use client";

/**
 * useTodaySession Hook
 *
 * Fetches today's session for a circle with attendance data.
 * Uses smart initialization from the backend.
 */

import { AttendanceStatus } from "@halaqat/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";

/**
 * Types for session data
 */
interface Student {
  id: string;
  name: string;
  phone: string | null;
}

interface Attendance {
  id: string;
  status: AttendanceStatus;
  studentId: string;
  student: Student;
}

interface Circle {
  id: string;
  name: string;
}

interface Recitation {
  id: string;
  pageNumber: number;
  studentId: string;
  mistakesCount: number;
}

interface PointTransaction {
  id: string;
  amount: number;
  studentId: string;
}

interface Session {
  id: string;
  date: string;
  status: "OPEN" | "CLOSED";
  notes: string | null;
  circleId: string;
  circle: Circle;
  attendances: Attendance[];
  recitations: Recitation[];
  pointTransactions: PointTransaction[];
}

interface AttendanceUpdate {
  studentId: string;
  status: AttendanceStatus;
}

interface BulkAttendanceDto {
  updates: AttendanceUpdate[];
}

/**
 * Fetch today's session for a circle
 */
/**
 * Fetch today's session for a circle
 */
export function useTodaySession(circleId: string | undefined) {
  return useQuery({
    queryKey: ["session", "today", circleId],
    queryFn: async () => {
      if (!circleId || circleId === "undefined") {
        throw new Error("Invalid circle ID");
      }
      const response = await api.get<Session | null>(
        `/sessions/today?circleId=${circleId}`,
      );
      // Backend returns empty string or null if not found
      if (!response.data) return null;
      return response.data;
    },
    enabled: !!circleId && circleId !== "undefined",
    retry: false,
  });
}

/**
 * Start a new session for today
 */
export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (circleId: string) => {
      const response = await api.post<Session>(
        `/sessions/today?circleId=${circleId}`,
      );
      return response.data;
    },
    onSuccess: (data, circleId) => {
      queryClient.setQueryData(["session", "today", circleId], data);
    },
  });
}

/**
 * Update attendance records in bulk
 */
export function useUpdateAttendance(sessionId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: AttendanceUpdate[]) => {
      if (!sessionId || sessionId === "undefined") {
        throw new Error("Invalid session ID");
      }
      const response = await api.patch<Session>(
        `/sessions/${sessionId}/attendance`,
        {
          updates: updates.filter(
            (u) => u.studentId && u.studentId !== "undefined",
          ),
        } as BulkAttendanceDto,
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Update the cache with new data
      queryClient.setQueryData(["session", "today", data.circleId], data);
    },
  });
}

/**
 * Get session history for a circle
 */
export function useSessionHistory(circleId: string | undefined, limit = 30) {
  return useQuery({
    queryKey: ["sessions", "history", circleId, limit],
    queryFn: async () => {
      if (!circleId || circleId === "undefined") {
        throw new Error("Invalid circle ID");
      }
      const response = await api.get<Session[]>(
        `/sessions/history?circleId=${circleId}&limit=${limit}`,
      );
      return response.data;
    },
    enabled: !!circleId && circleId !== "undefined",
  });
}
