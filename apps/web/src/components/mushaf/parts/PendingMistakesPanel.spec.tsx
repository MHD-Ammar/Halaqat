import { MistakeType } from "@halaqat/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PendingMistakesPanel } from "./PendingMistakesPanel";

const mistake = {
  wordLocation: "1:1:1",
  pageNumber: 1,
  surahNumber: 1,
  ayahNumber: 1,
  wordPosition: 1,
  mistakeType: MistakeType.MEMORIZATION,
  wordText: "الحمد",
};

describe("PendingMistakesPanel", () => {
  it("renders list item", () => {
    render(
      <PendingMistakesPanel
        open
        pendingMistakesByPage={{ 1: [mistake] }}
        pendingForPage={[mistake]}
        totalCount={1}
        currentPage={1}
        onClose={vi.fn()}
        onRemove={vi.fn()}
        onClearPage={vi.fn()}
      />,
    );

    expect(screen.getByText("الحمد")).toBeInTheDocument();
  });

  it("calls onRemove", async () => {
    const onRemove = vi.fn();
    render(
      <PendingMistakesPanel
        open
        pendingMistakesByPage={{ 1: [mistake] }}
        pendingForPage={[mistake]}
        totalCount={1}
        currentPage={1}
        onClose={vi.fn()}
        onRemove={onRemove}
        onClearPage={vi.fn()}
      />,
    );

    const removeButtons = screen.getAllByRole("button", { name: /إزالة خطأ/i });
    await userEvent.click(removeButtons[0]!);
    expect(onRemove).toHaveBeenCalledWith("1:1:1", 1);
  });
});

