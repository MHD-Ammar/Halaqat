"use client";

/**
 * useApiErrorToast
 *
 * Returns a stable `onError` callback that extracts the Arabic user-facing
 * message from an `ApiError` (or any unknown error) and shows it in a
 * destructive toast.
 *
 * Usage in a mutation:
 *   const { onError } = useApiErrorToast();
 *   const mutation = useMutation({ mutationFn: ..., onError });
 *
 * Or inline:
 *   onError: useApiErrorToast().onError
 */

import { useCallback } from "react";

import { ApiError } from "@/lib/api-client";

import { useToast } from "./use-toast";

export function useApiErrorToast() {
  const { toast } = useToast();

  const onError = useCallback(
    (err: unknown) => {
      const messageAr =
        err instanceof ApiError
          ? err.messageAr
          : "حدث خطأ غير متوقع، حاول مرة أخرى";

      toast({
        variant: "destructive",
        title: "خطأ",
        description: messageAr,
      });
    },
    [toast],
  );

  return { onError };
}
