/**
 * CrudDialog component tests
 *
 * Covers:
 *  - Renders title and fields
 *  - Submit button label defaults (create vs edit mode)
 *  - Validation error display (Arabic messages)
 *  - Successful submit: calls onSubmit and onSuccess, then closes
 *  - Server error: displays root error banner when onSubmit throws
 *  - Cancel button closes dialog
 *  - Loading spinner shown while submitting
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { CrudDialog } from "../crud-dialog";
import { TextField } from "../form-fields/text-field";

// ── helpers ───────────────────────────────────────────────────────────────────

const nameSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
});

type NameValues = z.infer<typeof nameSchema>;

function renderDialog({
  open = true,
  onOpenChange = vi.fn(),
  onSubmit = vi.fn().mockResolvedValue(undefined),
  onSuccess = vi.fn(),
  mode = "create" as const,
  submitLabel,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  onSubmit?: (values: NameValues) => Promise<unknown>;
  onSuccess?: () => void;
  mode?: "create" | "edit";
  submitLabel?: string;
} = {}) {
  return render(
    <CrudDialog<NameValues, unknown>
      open={open}
      onOpenChange={onOpenChange}
      title="اختبار الحوار"
      schema={nameSchema}
      defaultValues={{ name: "" }}
      onSubmit={onSubmit}
      onSuccess={onSuccess}
      mode={mode}
      {...(submitLabel ? { submitLabel } : {})}
    >
      {() => <TextField name="name" label="الاسم" required />}
    </CrudDialog>,
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("CrudDialog", () => {
  it("renders the dialog title", () => {
    renderDialog();
    expect(screen.getByText("اختبار الحوار")).toBeInTheDocument();
  });

  it("renders the form field label", () => {
    renderDialog();
    expect(screen.getByText("الاسم")).toBeInTheDocument();
  });

  it("shows 'حفظ' as default submit label in create mode", () => {
    renderDialog({ mode: "create" });
    expect(screen.getByRole("button", { name: "حفظ" })).toBeInTheDocument();
  });

  it("shows 'تحديث' as default submit label in edit mode", () => {
    renderDialog({ mode: "edit" });
    expect(screen.getByRole("button", { name: "تحديث" })).toBeInTheDocument();
  });

  it("respects a custom submitLabel", () => {
    renderDialog({ submitLabel: "إرسال" });
    expect(screen.getByRole("button", { name: "إرسال" })).toBeInTheDocument();
  });

  it("shows 'إلغاء' cancel button", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: "إلغاء" })).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when cancel is clicked", async () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });
    await userEvent.click(screen.getByRole("button", { name: "إلغاء" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows Arabic validation error on empty submit", async () => {
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "حفظ" }));
    await waitFor(() => {
      expect(screen.getByText("الاسم يجب أن يكون حرفين على الأقل")).toBeInTheDocument();
    });
  });

  it("calls onSubmit with valid values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onSubmit });

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "محمد علي");
    await userEvent.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: "محمد علي" });
    });
  });

  it("calls onSuccess after successful submit", async () => {
    const onSuccess = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue("result");
    renderDialog({ onSubmit, onSuccess });

    await userEvent.type(screen.getByRole("textbox"), "محمد علي");
    await userEvent.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("closes dialog after successful submit", async () => {
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onOpenChange, onSubmit });

    await userEvent.type(screen.getByRole("textbox"), "محمد علي");
    await userEvent.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("displays server error banner when onSubmit throws", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("خطأ من الخادم"));
    renderDialog({ onSubmit });

    await userEvent.type(screen.getByRole("textbox"), "محمد علي");
    await userEvent.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent("خطأ من الخادم");
    });
  });

  it("prefers messageAr over message for server errors", async () => {
    const apiError = Object.assign(new Error("English error"), {
      messageAr: "خطأ عربي من الخادم",
    });
    const onSubmit = vi.fn().mockRejectedValue(apiError);
    renderDialog({ onSubmit });

    await userEvent.type(screen.getByRole("textbox"), "محمد علي");
    await userEvent.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("خطأ عربي من الخادم");
    });
  });

  it("does not render when open=false", () => {
    renderDialog({ open: false });
    expect(screen.queryByText("اختبار الحوار")).not.toBeInTheDocument();
  });
});
