import { MistakeType } from "@halaqat/types";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePendingMistakes } from "./usePendingMistakes";

const word = {
  location: "1:1:1",
  text: "الحمد",
  char_type_name: "word",
} as unknown;

describe("usePendingMistakes", () => {
  it("toggle adds then removes the same word with same type", () => {
    const { result } = renderHook(() =>
      usePendingMistakes({ currentPage: 1, savedWordLocations: new Set() }),
    );

    act(() => result.current.toggleWord(word, MistakeType.MEMORIZATION, 1));
    expect(result.current.totalCount).toBe(1);

    act(() => result.current.toggleWord(word, MistakeType.MEMORIZATION, 1));
    expect(result.current.totalCount).toBe(0);
  });

  it("undo removes most recently added mistake on page", () => {
    const { result } = renderHook(() =>
      usePendingMistakes({ currentPage: 1, savedWordLocations: new Set() }),
    );

    act(() => {
      result.current.toggleWord({ ...word, location: "1:1:1" }, MistakeType.MEMORIZATION, 1);
      result.current.toggleWord({ ...word, location: "1:1:2" }, MistakeType.TAJWEED, 1);
    });

    expect(result.current.totalCount).toBe(2);
    act(() => result.current.undoLastOnPage(1));
    expect(result.current.totalCount).toBe(1);
  });

  it("clearAll empties all pending mistakes", () => {
    const { result } = renderHook(() =>
      usePendingMistakes({ currentPage: 1, savedWordLocations: new Set() }),
    );

    act(() => result.current.toggleWord(word, MistakeType.MEMORIZATION, 1));
    expect(result.current.totalCount).toBe(1);

    act(() => result.current.clearAll());
    expect(result.current.totalCount).toBe(0);
  });
});

