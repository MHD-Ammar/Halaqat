import { MistakeType } from "@halaqat/types";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMushafKeyboard } from "./useMushafKeyboard";

function fire(key: string, ctrlKey = false) {
  document.dispatchEvent(new KeyboardEvent("keydown", { key, ctrlKey }));
}

describe("useMushafKeyboard", () => {
  it("triggers navigation and mode shortcuts", () => {
    const onPrevPage = vi.fn();
    const onNextPage = vi.fn();
    const onSetMode = vi.fn();

    renderHook(() =>
      useMushafKeyboard({
        onPrevPage,
        onNextPage,
        onSetMode,
        onUndo: vi.fn(),
        onSave: vi.fn(),
        onCloseAllDrawers: vi.fn(),
        onOpenPageJump: vi.fn(),
        enabled: true,
      }),
    );

    fire("ArrowLeft");
    fire("ArrowRight");
    fire("m");
    fire("t");

    expect(onNextPage).toHaveBeenCalledTimes(1);
    expect(onPrevPage).toHaveBeenCalledTimes(1);
    expect(onSetMode).toHaveBeenCalledWith(MistakeType.MEMORIZATION);
    expect(onSetMode).toHaveBeenCalledWith(MistakeType.TAJWEED);
  });

  it("does not fire while typing in input", () => {
    const onSave = vi.fn();
    renderHook(() =>
      useMushafKeyboard({
        onPrevPage: vi.fn(),
        onNextPage: vi.fn(),
        onSetMode: vi.fn(),
        onUndo: vi.fn(),
        onSave,
        onCloseAllDrawers: vi.fn(),
        onOpenPageJump: vi.fn(),
        enabled: true,
      }),
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(onSave).not.toHaveBeenCalled();
    input.remove();
  });
});

