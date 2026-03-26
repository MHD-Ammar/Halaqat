import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

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
    queryKey: ["student-milestones"],
    queryFn: async () => {
      const { data } = await api.get("/student-portal/milestones");
      return data;
    },
  });
};

export const useClaimMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestoneId: string) => {
      const { data } = await api.post(`/student-portal/milestones/${milestoneId}/claim`);
      return data;
    },
    onSuccess: () => {
      // Invalidate both milestones and dashboard to update XP
      queryClient.invalidateQueries({ queryKey: ["student-milestones"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      // Invalidate student profile/quests if needed
      queryClient.invalidateQueries({ queryKey: ["student-quests", "today"] });
    },
  });
};
