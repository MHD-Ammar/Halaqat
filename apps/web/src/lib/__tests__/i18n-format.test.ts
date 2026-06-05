import { describe, expect, it } from "vitest";

import { formatMistakeCount, mistakeCountBadge } from "../i18n-format";

// ── formatMistakeCount ────────────────────────────────────────────────────────

describe("formatMistakeCount", () => {
  // ── zero ──────────────────────────────────────────────────────────────────
  it('returns "لا أخطاء" for 0', () => {
    expect(formatMistakeCount(0)).toBe("لا أخطاء");
  });

  // ── one ───────────────────────────────────────────────────────────────────
  it('returns "خطأ واحد" for 1', () => {
    expect(formatMistakeCount(1)).toBe("خطأ واحد");
  });

  // ── dual ──────────────────────────────────────────────────────────────────
  it('returns "خطآن" for 2', () => {
    expect(formatMistakeCount(2)).toBe("خطآن");
  });

  // ── plural (3 – 10) ───────────────────────────────────────────────────────
  it.each([3, 4, 5, 6, 7, 8, 9, 10])(
    'returns "{n} أخطاء" for %i',
    (n) => {
      expect(formatMistakeCount(n)).toBe(`${n} أخطاء`);
    },
  );

  // ── counted-noun form (11+) ───────────────────────────────────────────────
  it.each([11, 12, 20, 50, 99, 100, 604])(
    'returns "{n} خطأ" for %i',
    (n) => {
      expect(formatMistakeCount(n)).toBe(`${n} خطأ`);
    },
  );

  // ── boundary cases ────────────────────────────────────────────────────────
  it("handles boundary n=10 as plural (أخطاء), not counted-noun", () => {
    expect(formatMistakeCount(10)).toBe("10 أخطاء");
  });

  it("handles boundary n=11 as counted-noun (خطأ), not plural", () => {
    expect(formatMistakeCount(11)).toBe("11 خطأ");
  });

  // ── guard: negative / non-finite ─────────────────────────────────────────
  it("throws RangeError for negative numbers", () => {
    expect(() => formatMistakeCount(-1)).toThrow(RangeError);
  });

  it("throws RangeError for Infinity", () => {
    expect(() => formatMistakeCount(Infinity)).toThrow(RangeError);
  });

  it("throws RangeError for NaN", () => {
    expect(() => formatMistakeCount(NaN)).toThrow(RangeError);
  });
});

// ── mistakeCountBadge ─────────────────────────────────────────────────────────

describe("mistakeCountBadge", () => {
  it('returns "0" for 0', () => {
    expect(mistakeCountBadge(0)).toBe("0");
  });

  it("returns the string representation of positive integers", () => {
    expect(mistakeCountBadge(1)).toBe("1");
    expect(mistakeCountBadge(42)).toBe("42");
    expect(mistakeCountBadge(604)).toBe("604");
  });

  it("clamps negative values to 0", () => {
    expect(mistakeCountBadge(-5)).toBe("0");
  });
});
