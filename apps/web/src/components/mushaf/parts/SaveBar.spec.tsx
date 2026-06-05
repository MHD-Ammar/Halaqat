import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SaveBar } from "./SaveBar";

describe("SaveBar", () => {
  it("disables save when count is zero", () => {
    render(
      <SaveBar
        totalCount={0}
        pendingOnPageCount={0}
        isSaving={false}
        reviewOpen={false}
        pagesWithMistakesCount={0}
        onUndo={vi.fn()}
        onToggleReview={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /لا توجد أخطاء للحفظ/i })).toBeDisabled();
  });

  it("shows spinner when saving", () => {
    render(
      <SaveBar
        totalCount={2}
        pendingOnPageCount={2}
        isSaving
        reviewOpen={false}
        pagesWithMistakesCount={1}
        onUndo={vi.fn()}
        onToggleReview={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText(/جاري الحفظ/i)).toBeInTheDocument();
  });

  it("calls onToggleReview", async () => {
    const onToggleReview = vi.fn();
    render(
      <SaveBar
        totalCount={2}
        pendingOnPageCount={2}
        isSaving={false}
        reviewOpen={false}
        pagesWithMistakesCount={1}
        onUndo={vi.fn()}
        onToggleReview={onToggleReview}
        onSave={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /أخطاء معلقة/i }));
    expect(onToggleReview).toHaveBeenCalledTimes(1);
  });
});

