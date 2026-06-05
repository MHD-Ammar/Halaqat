/**
 * Error Code Catalog
 *
 * Single source of truth for every error code the API can return.
 * The frontend ApiError consumer reads the same shape.
 */

export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",

  // Resources
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",
  GONE: "GONE",

  // Domain-specific
  STUDENT_NOT_IN_CIRCLE: "STUDENT_NOT_IN_CIRCLE",
  QUEST_ALREADY_COMPLETED: "QUEST_ALREADY_COMPLETED",
  CAMPAIGN_NOT_ACTIVE: "CAMPAIGN_NOT_ACTIVE",
  INSUFFICIENT_XP: "INSUFFICIENT_XP",
  STORE_ITEM_OUT_OF_STOCK: "STORE_ITEM_OUT_OF_STOCK",
  SESSION_ALREADY_EXISTS_TODAY: "SESSION_ALREADY_EXISTS_TODAY",
  RECITATION_NOT_OWNED: "RECITATION_NOT_OWNED",
  CIRCLE_ACCESS_DENIED: "CIRCLE_ACCESS_DENIED",

  // Infrastructure
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Map an HTTP status code to the closest generic ErrorCode.
 * Used by the global filter when converting plain HttpExceptions.
 */
export function mapStatusToCode(status: number): ErrorCode {
  switch (status) {
    case 400: return ERROR_CODES.INVALID_INPUT;
    case 401: return ERROR_CODES.UNAUTHORIZED;
    case 403: return ERROR_CODES.FORBIDDEN;
    case 404: return ERROR_CODES.NOT_FOUND;
    case 409: return ERROR_CODES.CONFLICT;
    case 410: return ERROR_CODES.GONE;
    case 422: return ERROR_CODES.VALIDATION_ERROR;
    default:  return ERROR_CODES.INTERNAL_ERROR;
  }
}
