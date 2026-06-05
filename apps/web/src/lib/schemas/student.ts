import { z } from "zod";

import { arabicValidators } from "@/lib/validation";

export const createStudentSchema = z.object({
  name: arabicValidators.minString("اسم الطالب"),
  circleId: z.string().min(1, "اختر الحلقة"),
  guardianName: z.string().optional().or(z.literal("")),
  guardianPhone: arabicValidators.optionalPhone(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const editStudentSchema = z.object({
  name: arabicValidators.minString("اسم الطالب"),
  circleId: z.string().min(1, "اختر الحلقة"),
  phone: arabicValidators.optionalPhone(),
  dob: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v),
      "تاريخ بصيغة YYYY-MM-DD",
    ),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  guardianName: z.string().optional().or(z.literal("")),
  guardianPhone: arabicValidators.optionalPhone(),
});

export type EditStudentInput = z.infer<typeof editStudentSchema>;
