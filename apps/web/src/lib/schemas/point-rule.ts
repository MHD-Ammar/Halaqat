import { z } from "zod";

import { arabicValidators } from "@/lib/validation";

/**
 * Schema for creating a custom point rule.
 * Maps to CreatePointRuleDto in use-settings.ts.
 */
export const createPointRuleSchema = z
  .object({
    description: arabicValidators.requiredString("الوصف"),
    points: arabicValidators.nonNegativeInt("النقاط"),
    isCustomEntry: z.boolean().default(false),
    maxCustomValue: z
      .number()
      .int()
      .min(1, "الحد الأقصى يجب أن يكون 1 على الأقل")
      .optional(),
  })
  .refine(
    (data) => !data.isCustomEntry || typeof data.maxCustomValue === "number",
    {
      message: "الحد الأقصى مطلوب عند تفعيل الإدخال المخصص",
      path: ["maxCustomValue"],
    },
  );

export type CreatePointRuleInput = z.infer<typeof createPointRuleSchema>;

/**
 * Schema for updating mosque point rules in bulk.
 */
export const updatePointRulesSchema = z.object({
  rules: z
    .array(
      z.object({
        key: z.string().min(1),
        points: arabicValidators.nonNegativeInt("النقاط"),
      }),
    )
    .min(1, "يجب توفير قاعدة واحدة على الأقل"),
});

export type UpdatePointRulesInput = z.infer<typeof updatePointRulesSchema>;
