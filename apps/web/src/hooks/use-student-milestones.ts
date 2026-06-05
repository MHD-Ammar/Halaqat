import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

type RewardType = "BONUS_XP" | "AVATAR_FRAME" | "TITLE";

export interface MilestoneReward {
  id: string;
  targetLevel: number;
  title: string;
  rewardType: RewardType | string;
  rewardValue: string;
}

export interface StudentMilestone {
  id: string;
  studentId: string;
  milestoneId: string;
  isClaimed: boolean;
  unlockedAt: string | null;
  milestone: MilestoneReward;
}

export const useStudentMilestones = () => {
  return useQuery<StudentMilestone[]>({
    queryKey: queryKeys.studentPortal.milestones(),
    queryFn: () => apiClient.get<StudentMilestone[]>("/student-portal/milestones"),
  });
};

export const useClaimMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestoneId: string) => {
      const data = await apiClient.post(`/student-portal/milestones/${milestoneId}/claim`);
      return data;
    },
    onSuccess: () => {
      // Invalidate both milestones and dashboard to update XP
      queryClient.invalidateQueries({ queryKey: queryKeys.studentPortal.milestones() });
      queryClient.invalidateQueries({ queryKey: queryKeys.studentPortal.all });
      // Invalidate student profile/quests if needed
      queryClient.invalidateQueries({ queryKey: queryKeys.studentPortal.quests.today() });
    },
  });
};
