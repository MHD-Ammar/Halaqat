"use client";

/**
 * CrudDialog<TFormValues, TResult>
 *
 * Generic dialog primitive that owns:
 *  - react-hook-form + Zod resolver lifecycle
 *  - Loading state (disables both buttons, shows spinner)
 *  - Server-error display (sets form.root error, shown as an alert block)
 *  - Auto-reset on close
 *  - Consistent Arabic cancel / submit labels
 *
 * Usage:
 *   <CrudDialog schema={mySchema} defaultValues={...} onSubmit={fn} ...>
 *     {(form) => <TextField name="title" label="العنوان" required />}
 *   </CrudDialog>
 *
 * The children render-prop receives the live `UseFormReturn` so callers can
 * read `form.watch(...)` for conditional fields — without importing
 * react-hook-form themselves.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import {
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { type ZodType } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Size map ────────────────────────────────────────────────────────────────

const SIZE_CLASS: Record<NonNullable<CrudDialogProps<never, never>["size"]>, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-[500px]",
  lg: "sm:max-w-[700px]",
};

// ── Public types ─────────────────────────────────────────────────────────────

export interface CrudDialogProps<TFormValues extends FieldValues, TResult> {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /** Dialog title (Arabic) */
  title: string;
  /** Optional subtitle below the title */
  description?: string;

  /** Zod schema — error messages should be Arabic strings */
  schema: ZodType<TFormValues>;
  /** Default / empty field values. Required so RHF can infer the shape. */
  defaultValues: DefaultValues<TFormValues>;

  /**
   * The mutation function. Must throw on failure.
   * `ApiError.messageAr` (Task-47) is displayed automatically;
   * plain `Error.message` is used as fallback.
   */
  onSubmit: (values: TFormValues) => Promise<TResult>;

  /** Called after a successful submit (toast, parent state reset, etc.). */
  onSuccess?: (result: TResult, values: TFormValues) => void;

  /** Submit button label. Defaults to "تحديث" in edit mode, "حفظ" otherwise. */
  submitLabel?: string;
  /** Cancel button label. Default: "إلغاء" */
  cancelLabel?: string;
  /** "edit" → submit defaults to "تحديث". */
  mode?: "create" | "edit";

  /**
   * Render-prop for the form body.
   * The surrounding `FormProvider` is already in place — just use the field
   * components from `@/components/ui/form-fields/*`.
   * The form instance is passed in case conditional rendering needs watchers.
   */
  children: (form: UseFormReturn<TFormValues>) => ReactNode;

  /** Dialog width. Default: "md" */
  size?: "sm" | "md" | "lg";
}

// ── Component ────────────────────────────────────────────────────────────────

export function CrudDialog<TFormValues extends FieldValues, TResult = unknown>({
  open,
  onOpenChange,
  title,
  description,
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  submitLabel,
  cancelLabel = "إلغاء",
  mode = "create",
  children,
  size = "md",
}: CrudDialogProps<TFormValues, TResult>) {
  const form = useForm<TFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as any,
    defaultValues,
  });

  // Reset form (and clear server errors) whenever the dialog closes.
  useEffect(() => {
    if (!open) form.reset(defaultValues);
    // defaultValues is a stable reference from the caller — intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const resolvedSubmitLabel =
    submitLabel ?? (mode === "edit" ? "تحديث" : "حفظ");

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await onSubmit(values);
      onSuccess?.(result, values);
      onOpenChange(false);
    } catch (err) {
      // ApiError (Task-47) carries a user-facing Arabic message.
      // Fallback to generic message for plain errors or network failures.
      const message =
        (err as { messageAr?: string }).messageAr ??
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message ??
        (err as Error).message ??
        "حدث خطأ غير متوقع، حاول مرة أخرى";

      form.setError("root", {
        type: "server",
        message: Array.isArray(message) ? message.join("، ") : message,
      });
    }
  });

  const { isSubmitting } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SIZE_CLASS[size]} dir="rtl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {children(form)}

            {/* Server / root-level error banner */}
            {form.formState.errors.root && (
              <div
                role="alert"
                className="rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter className="gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {cancelLabel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
                )}
                {resolvedSubmitLabel}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
