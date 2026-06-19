/**
 * API Error Translation
 *
 * The backend always returns error messages in English (for logs and
 * consistency). For the UI we translate them. This module centralises that
 * mapping so every surface shows a consistent, localized message instead of a
 * raw backend string.
 *
 * Resolution order:
 *  1. Match the backend message text against a known key (KNOWN_MESSAGE_KEYS).
 *  2. Otherwise fall back to a generic message keyed by HTTP status.
 *  3. Otherwise a final generic fallback.
 *
 * All keys live under the `ApiErrors` namespace in the message catalogues.
 */

import type { AxiosError } from "axios";

/**
 * Minimal translator shape this module needs: key → string. It is intentionally
 * narrower than next-intl's full signature (we never pass interpolation values
 * here) so a next-intl `useTranslations("ApiErrors")` result is assignable to
 * it without type friction.
 */
export type Translator = (key: string) => string;

/**
 * Map of exact backend messages → translation keys (under `ApiErrors`).
 * Keep the left-hand side identical to what the API throws.
 */
const KNOWN_MESSAGE_KEYS: Record<string, string> = {
  "You do not have permission to view this student": "forbiddenStudent",
  "Cannot move student to a circle you do not own": "forbiddenCircleMove",
  "لا يمكنك الوصول إلى ملف طالب آخر": "forbiddenStudent", // legacy/Arabic-thrown safety net
};

/** Generic fallbacks keyed by HTTP status code. */
const STATUS_KEYS: Record<number, string> = {
  400: "badRequest",
  401: "unauthorized",
  403: "forbidden",
  404: "notFound",
  409: "conflict",
  422: "validation",
  429: "tooManyRequests",
  500: "serverError",
  502: "serverError",
  503: "serverError",
};

interface ApiErrorBody {
  message?: string | string[];
  statusCode?: number;
}

/** Pull the raw backend message (string) out of an axios error, if any. */
export function extractApiMessage(error: unknown): string | null {
  const axiosErr = error as AxiosError<ApiErrorBody> | undefined;
  const data = axiosErr?.response?.data;
  if (!data) return null;
  const msg = data.message;
  if (Array.isArray(msg)) return msg[0] ?? null; // class-validator returns arrays
  return msg ?? null;
}

/**
 * Translate an API error into a localized, user-facing string.
 *
 * @param error - the caught error (typically an AxiosError)
 * @param t - a translator scoped to the `ApiErrors` namespace
 *            (e.g. `useTranslations("ApiErrors")`)
 */
export function getApiErrorMessage(error: unknown, t: Translator): string {
  const raw = extractApiMessage(error);

  // 1. Known message → specific translation.
  if (raw && KNOWN_MESSAGE_KEYS[raw]) {
    return t(KNOWN_MESSAGE_KEYS[raw] as string);
  }

  // 2. HTTP status → generic translation.
  const status = (error as AxiosError | undefined)?.response?.status;
  if (status && STATUS_KEYS[status]) {
    return t(STATUS_KEYS[status] as string);
  }

  // 3. Last resort: the raw message (still informative) or a generic line.
  return raw ?? t("generic");
}
