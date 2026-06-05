import { QuestCategory } from "@halaqat/types";
import { z } from "zod";

import { arabicValidators } from "@/lib/validation";

export const CRITERIA_TYPES = [
  "STREAK_DAYS",
  "TOTAL_XP",
  "TOTAL_QUESTS_CATEGORY",
] as const;
export type AchievementCriteriaType = (typeof CRITERIA_TYPES)[number];

export const RARITY_TYPES = ["COMMON", "RARE", "EPIC", "LEGENDARY"] as const;
export type RarityType = (typeof RARITY_TYPES)[number];

export const RARITY_LABELS: Record<RarityType, string> = {
  COMMON: "شائع",
  RARE: "نادر",
  EPIC: "ملحمي",
  LEGENDARY: "أسطوري",
};

export const createAchievementSchema = z
  .object({
    title: arabicValidators.minString("العنوان"),
    description: arabicValidators.minString("الوصف"),
    badgeIcon: z.string().min(1, "أيقونة مطلوبة"),
    criteriaType: z.enum(CRITERIA_TYPES, { message: "اختر نوع المعيار" }),
    criteriaTarget: arabicValidators.positiveInt("الهدف"),
    criteriaCategory: z.nativeEnum(QuestCategory).nullable().optional(),
    rarity: z.enum(RARITY_TYPES, { message: "اختر مستوى الندرة" }),
  })
  .refine(
    (data) =>
      data.criteriaType !== "TOTAL_QUESTS_CATEGORY" || !!data.criteriaCategory,
    {
      message: "التصنيف مطلوب عند اختيار نوع المعيار 'إجمالي المهام حسب الفئة'",
      path: ["criteriaCategory"],
    },
  );

export type CreateAchievementInput = z.infer<typeof createAchievementSchema>;
export type EditAchievementInput = CreateAchievementInput;
