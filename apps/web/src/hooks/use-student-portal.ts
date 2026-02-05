"use client";

/**
 * useStudentPortal Hook
 *
 * Fetches the logged-in student's profile data using their linked studentId.
 */

import { useQuery } from "@tanstack/react-query";

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
