"use client";

/**
 * useAssignStudentToCircle Hook
 *
 * Mutation hook for assigning a student to a circle.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

interface AssignStudentData {
  studentId: string;
  circleId: string;
}

/**
 * Assign a student to a circle
 * PATCH /students/:id with { circleId: ... }
 */
export function useAssignStudentToCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, circleId }: AssignStudentData) => {
      const response = await api.patch(`/students/${studentId}`, {
        circleId,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["students", "unassigned"] });
      queryClient.invalidateQueries({
        queryKey: ["circles", variables.circleId],
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
