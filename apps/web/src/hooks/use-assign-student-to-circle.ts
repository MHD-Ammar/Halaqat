"use client";

/**
 * useAssignStudentToCircle Hook
 *
 * Mutation hook for assigning a student to a circle.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

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
      const data = await apiClient.patch(`/students/${studentId}`, {
        circleId,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.students.unassigned() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.circles.detail(variables.circleId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    },
  });
}
