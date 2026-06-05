import { z } from "zod";

import { arabicValidators } from "@/lib/validation";

/**
 * Schema for the basic campaign fields (title, dates, status).
 *
 * Note: `formConfig` is intentionally excluded from this schema because it
 * contains a discriminated-union structure (BOOLEAN / NUMBER / GRID / SELECT
 * question types) that is validated inline inside CampaignForm, which manages
 * the complex nested field-array logic itself.
 */
export const campaignBasicSchema = z
  .object({
    title: arabicValidators.minString("العنوان"),
    startDate: arabicValidators.isoDate(),
    endDate: arabicValidators.isoDate(),
    isActive: z.boolean(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء أو مساوياً له",
    path: ["endDate"],
  });

export type CampaignBasicInput = z.infer<typeof campaignBasicSchema>;
