import { z } from "zod";

import { arabicValidators } from "@/lib/validation";

export const USER_ROLES = ["ADMIN", "SUPERVISOR", "TEACHER", "EXAMINER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "مدير",
  SUPERVISOR: "مشرف",
  TEACHER: "معلم",
  EXAMINER: "مراقب",
};

export const createUserSchema = z.object({
  fullName: arabicValidators.minString("الاسم الكامل"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phoneNumber: z
    .string()
    .min(10, "رقم الهاتف قصير جداً")
    .regex(/^[0-9+\-\s()]+$/, "رقم هاتف غير صحيح"),
  password: arabicValidators.password(),
  role: z.enum(USER_ROLES, { message: "اختر دوراً صحيحاً" }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  fullName: arabicValidators.minString("الاسم الكامل"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phoneNumber: z
    .string()
    .min(10, "رقم الهاتف قصير جداً")
    .regex(/^[0-9+\-\s()]+$/, "رقم هاتف غير صحيح"),
  role: z.enum(USER_ROLES, { message: "اختر دوراً صحيحاً" }),
});

export type EditUserInput = z.infer<typeof editUserSchema>;

export const resetPasswordSchema = z.object({
  password: arabicValidators.password(),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
