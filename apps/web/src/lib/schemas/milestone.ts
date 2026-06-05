import { z } from "zod";

import { arabicValidators } from "@/lib/validation";

export const REWARD_TYPES = ["BONUS_XP", "AVATAR_FRAME", "TITLE"] as const;
export type RewardType = (typeof REWARD_TYPES)[number];

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  BONUS_XP: "نقاط إضافية",
  AVATAR_FRAME: "إطار الصورة",
  TITLE: "لقب",
};

export const createMilestoneSchema = z.object({
  targetLevel: arabicValidators.positiveInt("المستوى المستهدف"),
  title: arabicValidators.minString("العنوان"),
  rewardType: z.enum(REWARD_TYPES, { message: "اختر نوع المكافأة" }),
  rewardValue: z.string().min(1, "قيمة المكافأة مطلوبة"),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type EditMilestoneInput = CreateMilestoneInput;
