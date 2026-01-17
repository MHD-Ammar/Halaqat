"use client";

/**
 * useCreateTeacher Hook
 *
 * Mutation hook for creating new teacher accounts.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface CreateTeacherData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

interface CreateTeacherResponse {
  message: string;
  data: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    role: string;
  };
}

/**
 * Create a new teacher account
 * POST /users with role defaulting to TEACHER
 */
export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTeacherData) => {
      const response = await api.post<CreateTeacherResponse>("/users", {
        ...data,
        role: "TEACHER",
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate teacher-related queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["users", "teachers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "teachers"] });
    },
  });
}
