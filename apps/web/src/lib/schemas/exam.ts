import { z } from "zod";

import { arabicValidators } from "@/lib/validation";

/**
 * Schema for scheduling a new exam.
 * Maps to the exam creation endpoint (POST /exams).
 */
export const createExamSchema = z.object({
  studentId: arabicValidators.requiredUuid("الطالب"),
  date: arabicValidators.isoDate(),
  notes: z.string().optional().nullable(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;

/**
 * Schema for submitting exam results.
 */
export const submitExamResultSchema = z.object({
  score: z
    .number()
    .min(0, "الدرجة يجب أن تكون 0 أو أكثر")
    .max(100, "الدرجة يجب أن تكون 100 أو أقل"),
  passed: z.boolean(),
  notes: z.string().optional().nullable(),
});

export type SubmitExamResultInput = z.infer<typeof submitExamResultSchema>;
