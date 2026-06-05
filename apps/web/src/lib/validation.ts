/**
 * validation.ts
 *
 * Reusable Zod validator factories with Arabic error messages.
 *
 * All functions return a Zod schema fragment so they compose naturally:
 *
 *   z.object({
 *     fullName:    arabicValidators.requiredString("الاسم"),
 *     circleId:   arabicValidators.requiredUuid("الحلقة"),
 *     xpReward:   arabicValidators.positiveInt("مكافأة النقاط"),
 *     phone:      arabicValidators.phone(),
 *   })
 */

import { z } from "zod";

export const arabicValidators = {
  /** Non-empty string with a label in the error message. */
  requiredString: (label: string) =>
    z.string().min(1, `${label} مطلوب`),

  /** Non-empty string with min length. */
  minString: (label: string, min = 2) =>
    z.string().min(min, `${label} يجب أن يكون ${min} أحرف على الأقل`),

  /** UUID with a label-aware message. */
  requiredUuid: (label: string) =>
    z.string().uuid(`اختر ${label} صحيح`),

  /** Positive integer. */
  positiveInt: (label: string) =>
    z.number().int().positive(`${label} يجب أن يكون رقماً صحيحاً موجباً`),

  /** Non-negative integer (0 is allowed). */
  nonNegativeInt: (label: string) =>
    z.number().int().min(0, `${label} يجب أن يكون صفراً أو أكثر`),

  /** Positive decimal (e.g. XP multiplier). */
  positiveNumber: (label: string) =>
    z.number().positive(`${label} يجب أن يكون رقماً موجباً`),

  /** Arabic-only text. */
  arabicName: (label: string) =>
    z
      .string()
      .regex(
        /^[؀-ۿ\s]+$/,
        `${label} يجب أن يحتوي على حروف عربية فقط`,
      ),

  /** Generic international phone number. */
  phone: () =>
    z
      .string()
      .regex(
        /^(\+|00)?[1-9]\d{6,14}$/,
        "رقم هاتف غير صحيح",
      ),

  /** Saudi mobile number (05xxxxxxxx or +9665xxxxxxxx). */
  saudiPhone: () =>
    z
      .string()
      .regex(
        /^(\+966|0)5\d{8}$/,
        "رقم جوال سعودي غير صحيح",
      ),

  /** Optional phone — allows empty string, validates format if non-empty. */
  optionalPhone: () =>
    z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || /^[0-9+\-\s()]*$/.test(val),
        "رقم هاتف غير صحيح",
      ),

  /** ISO date string (YYYY-MM-DD). */
  isoDate: () =>
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ بصيغة YYYY-MM-DD"),

  /** ISO date that must be in the future. */
  futureDate: () =>
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ بصيغة YYYY-MM-DD")
      .refine(
        (d) => new Date(d) > new Date(),
        "التاريخ يجب أن يكون في المستقبل",
      ),

  /** Strong password (min 6 chars). */
  password: () =>
    z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
} as const;
