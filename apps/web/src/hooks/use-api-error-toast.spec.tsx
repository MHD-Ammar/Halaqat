import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

import { useApiErrorToast } from "./use-api-error-toast";

const toast = vi.fn();

vi.mock("./use-toast", () => ({
  useToast: () => ({ toast }),
}));

describe("useApiErrorToast", () => {
  beforeEach(() => toast.mockReset());

  it("shows messageAr for ApiError", () => {
    const { result } = renderHook(() => useApiErrorToast());

    result.current.onError(new ApiError(422, "VALIDATION_ERROR", "رسالة عربية"));

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
        description: "رسالة عربية",
      }),
    );
  });

  it("shows fallback for unknown errors", () => {
    const { result } = renderHook(() => useApiErrorToast());
    result.current.onError(new Error("boom"));

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining("حدث خطأ غير متوقع"),
      }),
    );
  });
});

