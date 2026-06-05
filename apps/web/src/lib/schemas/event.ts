import { z } from "zod";

import { arabicValidators } from "@/lib/validation";

export const createEventSchema = z
  .object({
    name: arabicValidators.minString("الاسم (إنجليزي)"),
    nameAr: arabicValidators.minString("الاسم (عربي)"),
    description: z.string().optional().nullable(),
    descriptionAr: z.string().optional().nullable(),
    startsAt: arabicValidators.isoDate(),
    endsAt: arabicValidators.isoDate(),
    xpMultiplier: arabicValidators.positiveNumber("مضاعف النقاط"),
    icon: z.string().min(1, "أيقونة مطلوبة"),
    themeColor: z.string().min(1, "اللون مطلوب"),
    isActive: z.boolean(),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء",
    path: ["endsAt"],
  });

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type EditEventInput = CreateEventInput;
