import { z } from "zod";

import { arabicValidators } from "@/lib/validation";

export const createCustomRuleSchema = z.object({
  description: arabicValidators.requiredString("الوصف"),
  points: arabicValidators.nonNegativeInt("النقاط"),
  isCustomEntry: z.boolean(),
  maxCustomValue: z.number().int().min(1, "الحد الأقصى يجب أن يكون 1 على الأقل").optional(),
});

export type CreateCustomRuleInput = z.infer<typeof createCustomRuleSchema>;
