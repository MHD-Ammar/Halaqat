import { QuestCategory, QuestFrequency } from "@halaqat/types";
import { z } from "zod";

import { arabicValidators } from "@/lib/validation";

export const createQuestSchema = z.object({
  title: arabicValidators.minString("العنوان"),
  description: z.string().optional().nullable(),
  category: z.nativeEnum(QuestCategory, { message: "اختر تصنيفاً صحيحاً" }),
  frequency: z.nativeEnum(QuestFrequency, { message: "اختر تكراراً صحيحاً" }),
  xpReward: arabicValidators.nonNegativeInt("مكافأة النقاط"),
  icon: z.string().min(1, "أيقونة مطلوبة"),
  isActive: z.boolean(),
  target: arabicValidators.positiveInt("الهدف"),
  targetUnit: z.string().optional().nullable(),
});

export type CreateQuestInput = z.infer<typeof createQuestSchema>;
export type EditQuestInput = CreateQuestInput;
