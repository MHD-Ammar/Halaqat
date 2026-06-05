/**
 * Arabic error messages for every ErrorCode.
 * Consumed by DomainException and the global exception filter.
 */

import type { ErrorCode } from "./error-codes";

export const ERROR_MESSAGES_AR: Record<ErrorCode, string> = {
  // Auth
  UNAUTHORIZED:         "الرجاء تسجيل الدخول",
  FORBIDDEN:            "ليس لديك صلاحية لهذا الإجراء",
  TOKEN_EXPIRED:        "انتهت صلاحية الجلسة، الرجاء تسجيل الدخول مجدداً",
  INVALID_CREDENTIALS:  "البريد الإلكتروني أو كلمة المرور غير صحيحة",

  // Validation
  VALIDATION_ERROR:     "بيانات الطلب غير صحيحة",
  INVALID_INPUT:        "مدخلات غير صالحة",

  // Resources
  NOT_FOUND:            "العنصر المطلوب غير موجود",
  ALREADY_EXISTS:       "هذا العنصر موجود مسبقاً",
  CONFLICT:             "تعارض في البيانات",
  GONE:                 "هذا العنصر لم يعد متاحاً",

  // Domain
  STUDENT_NOT_IN_CIRCLE:       "الطالب غير مسجل في هذه الحلقة",
  QUEST_ALREADY_COMPLETED:     "تم إنجاز هذه المهمة مسبقاً",
  CAMPAIGN_NOT_ACTIVE:         "لا توجد حملة نشطة حالياً",
  INSUFFICIENT_XP:             "رصيد النقاط غير كافٍ",
  STORE_ITEM_OUT_OF_STOCK:     "هذا العنصر غير متوفر في المخزن",
  SESSION_ALREADY_EXISTS_TODAY: "تم إنشاء جلسة لهذه الحلقة اليوم مسبقاً",
  RECITATION_NOT_OWNED:        "هذه التلاوة لا تنتمي إلى هذا الطالب",
  CIRCLE_ACCESS_DENIED:        "ليس لديك صلاحية الوصول لهذه الحلقة",

  // Infrastructure
  DATABASE_ERROR:        "حدث خطأ في قاعدة البيانات",
  EXTERNAL_SERVICE_ERROR:"حدث خطأ في خدمة خارجية",
  INTERNAL_ERROR:        "حدث خطأ داخلي، الرجاء المحاولة لاحقاً",
};
