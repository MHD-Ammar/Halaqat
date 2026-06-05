import { z } from "zod";

import { arabicValidators } from "@/lib/validation";

export const CIRCLE_GENDERS = ["MALE", "FEMALE"] as const;
export type CircleGender = (typeof CIRCLE_GENDERS)[number];

export const CIRCLE_GENDER_LABELS: Record<CircleGender, string> = {
  MALE: "ذكور",
  FEMALE: "إناث",
};

export const createCircleSchema = z.object({
  name: arabicValidators.minString("اسم الحلقة"),
  description: z.string().optional().or(z.literal("")),
  gender: z.enum(CIRCLE_GENDERS, { message: "اختر نوع الحلقة" }),
  teacherId: arabicValidators.requiredUuid("المعلم"),
});

export type CreateCircleInput = z.infer<typeof createCircleSchema>;

export const editCircleSchema = createCircleSchema;
export type EditCircleInput = z.infer<typeof editCircleSchema>;
