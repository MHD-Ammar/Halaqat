/**
 * Typed API Client
 *
 * Wraps the raw axios instance with typed methods that:
 *  1. Auto-extract `.data` from responses so callers never repeat that.
 *  2. Normalize all errors into `ApiError` with a consistent Arabic message.
 *
 * Use `apiClient` everywhere instead of the raw `api` axios instance for
 * new hooks. Existing hooks that still use `api` directly are safe — this
 * does not replace the instance, only wraps it.
 */

import { AxiosError, type AxiosRequestConfig } from "axios";

import { api } from "./api";

// ── Error class ────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    /** Machine-readable code from the backend, e.g. "VALIDATION_ERROR". */
    public readonly code: string,
    /** Arabic user-facing message, safe to show in a toast. */
    public readonly messageAr: string,
    /** Raw response body for debugging. */
    public readonly details?: unknown,
  ) {
    super(messageAr);
    this.name = "ApiError";
  }
}

// ── Error normalizer ───────────────────────────────────────────────────────

const STATUS_CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "UNPROCESSABLE",
  429: "TOO_MANY_REQUESTS",
  500: "INTERNAL_SERVER_ERROR",
  502: "BAD_GATEWAY",
  503: "SERVICE_UNAVAILABLE",
};

const STATUS_MESSAGES_AR: Record<number, string> = {
  400: "طلب غير صحيح",
  401: "الرجاء تسجيل الدخول مجدداً",
  403: "ليس لديك صلاحية",
  404: "العنصر غير موجود",
  409: "تعارض في البيانات",
  422: "بيانات غير صحيحة",
  429: "طلبات كثيرة، حاول لاحقاً",
  500: "خطأ في الخادم، حاول لاحقاً",
  502: "خطأ في البوابة، حاول لاحقاً",
  503: "الخدمة غير متاحة مؤقتاً",
};

function mapStatusToCode(status: number): string {
  return STATUS_CODES[status] ?? (status >= 500 ? "SERVER_ERROR" : "UNKNOWN");
}

function defaultMessageFor(status: number): string {
  return STATUS_MESSAGES_AR[status] ?? "حدث خطأ غير متوقع";
}

interface BackendErrorBody {
  code?: string;
  message?: string | string[];
  messageAr?: string;
}

function normalizeError(err: unknown): ApiError {
  if (err instanceof AxiosError) {
    const status = err.response?.status ?? 0;
    const body = err.response?.data as BackendErrorBody | undefined;

    const messageAr =
      body?.messageAr ??
      (Array.isArray(body?.message)
        ? body.message.join("، ")
        : body?.message) ??
      defaultMessageFor(status);

    return new ApiError(
      status,
      body?.code ?? mapStatusToCode(status),
      messageAr,
      body,
    );
  }
  return new ApiError(0, "UNKNOWN", "حدث خطأ غير متوقع", err);
}

// ── Typed client ───────────────────────────────────────────────────────────

export const apiClient = {
  get: async <TRes>(url: string, config?: AxiosRequestConfig): Promise<TRes> => {
    try {
      const { data } = await api.get<TRes>(url, config);
      return data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  post: async <TRes, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ): Promise<TRes> => {
    try {
      const { data } = await api.post<TRes>(url, body, config);
      return data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  put: async <TRes, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ): Promise<TRes> => {
    try {
      const { data } = await api.put<TRes>(url, body, config);
      return data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  patch: async <TRes, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ): Promise<TRes> => {
    try {
      const { data } = await api.patch<TRes>(url, body, config);
      return data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  delete: async <TRes = void>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<TRes> => {
    try {
      const { data } = await api.delete<TRes>(url, config);
      return data;
    } catch (e) {
      throw normalizeError(e);
    }
  },
};
