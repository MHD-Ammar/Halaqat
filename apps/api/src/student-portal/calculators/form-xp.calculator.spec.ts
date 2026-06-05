import { calculateXPFromFormConfig } from "./form-xp.calculator";

// ── Helper to build a minimal array-format question ──────────────────────────

const boolQ = (id: string, xpYes: number, xpNo: number) => ({
  id,
  type: "BOOLEAN" as const,
  title: id,
  xpYes,
  xpNo,
});

const numQ = (id: string, multiplier: number, max: number) => ({
  id,
  type: "NUMBER" as const,
  title: id,
  multiplier,
  max,
});

const selectQ = (id: string, options: { value: string; xp: number; label: string }[]) => ({
  id,
  type: "SELECT" as const,
  title: id,
  options,
});

const gridQ = (id: string, columns: { value: string; xp: number; label: string }[]) => ({
  id,
  type: "GRID" as const,
  title: id,
  rows: ["row1"],
  columns,
});

// ── Array format tests ────────────────────────────────────────────────────────

describe("calculateXPFromFormConfig — array format", () => {
  it("returns submitted_xp when questions array is empty", () => {
    const result = calculateXPFromFormConfig(
      {},
      { submitted_xp: 5, questions: [] },
    );
    expect(result).toBe(5);
  });

  it("returns 0 when no config provided", () => {
    expect(calculateXPFromFormConfig({}, {})).toBe(0);
  });

  it("returns 0 for null/undefined questions", () => {
    expect(calculateXPFromFormConfig({}, { questions: null as any })).toBe(0);
  });

  // BOOLEAN
  it("awards xpYes for a true boolean answer", () => {
    const result = calculateXPFromFormConfig(
      { q1: true },
      { questions: [boolQ("q1", 10, 0)] },
    );
    expect(result).toBe(10);
  });

  it("awards xpNo for a false boolean answer", () => {
    const result = calculateXPFromFormConfig(
      { q1: false },
      { questions: [boolQ("q1", 10, 3)] },
    );
    expect(result).toBe(3);
  });

  it("skips boolean question when answer is missing", () => {
    const result = calculateXPFromFormConfig(
      {},
      { questions: [boolQ("q1", 10, 5)] },
    );
    expect(result).toBe(0);
  });

  it("accumulates xp across multiple boolean questions", () => {
    const result = calculateXPFromFormConfig(
      { q1: true, q2: false },
      { questions: [boolQ("q1", 10, 0), boolQ("q2", 20, 4)] },
    );
    expect(result).toBe(14); // 10 + 4
  });

  // NUMBER
  it("multiplies number answer by multiplier", () => {
    const result = calculateXPFromFormConfig(
      { q1: 5 },
      { questions: [numQ("q1", 2, 100)] },
    );
    expect(result).toBe(10);
  });

  it("clamps number answer to max", () => {
    const result = calculateXPFromFormConfig(
      { q1: 200 },
      { questions: [numQ("q1", 2, 10)] },
    );
    expect(result).toBe(20); // 10 * 2
  });

  it("treats non-numeric string as 0 for number question", () => {
    const result = calculateXPFromFormConfig(
      { q1: "abc" },
      { questions: [numQ("q1", 5, 100)] },
    );
    expect(result).toBe(0);
  });

  it("coerces numeric string to number", () => {
    const result = calculateXPFromFormConfig(
      { q1: "3" },
      { questions: [numQ("q1", 4, 100)] },
    );
    expect(result).toBe(12);
  });

  // SELECT
  it("awards xp for matching select option", () => {
    const result = calculateXPFromFormConfig(
      { q1: "opt_a" },
      { questions: [selectQ("q1", [{ value: "opt_a", xp: 15, label: "A" }, { value: "opt_b", xp: 5, label: "B" }])] },
    );
    expect(result).toBe(15);
  });

  it("awards 0 for unmatched select option", () => {
    const result = calculateXPFromFormConfig(
      { q1: "opt_z" },
      { questions: [selectQ("q1", [{ value: "opt_a", xp: 15, label: "A" }])] },
    );
    expect(result).toBe(0);
  });

  // GRID
  it("sums xp for each grid cell value", () => {
    const columns = [
      { value: "good", xp: 10, label: "Good" },
      { value: "bad", xp: 2, label: "Bad" },
    ];
    const result = calculateXPFromFormConfig(
      { q1: { row1: "good", row2: "bad" } },
      { questions: [gridQ("q1", columns)] },
    );
    expect(result).toBe(12); // 10 + 2
  });

  it("skips unknown grid cell values", () => {
    const columns = [{ value: "good", xp: 10, label: "Good" }];
    const result = calculateXPFromFormConfig(
      { q1: { row1: "unknown" } },
      { questions: [gridQ("q1", columns)] },
    );
    expect(result).toBe(0);
  });

  // submitted_xp accumulation
  it("adds submitted_xp on top of question xp", () => {
    const result = calculateXPFromFormConfig(
      { q1: true },
      { submitted_xp: 5, questions: [boolQ("q1", 10, 0)] },
    );
    expect(result).toBe(15);
  });

  it("uses 0 when submitted_xp is undefined", () => {
    const result = calculateXPFromFormConfig(
      { q1: true },
      { questions: [boolQ("q1", 10, 0)] },
    );
    expect(result).toBe(10);
  });
});

// ── Legacy format tests ───────────────────────────────────────────────────────

describe("calculateXPFromFormConfig — legacy format", () => {
  it("handles legacy BOOLEAN yes", () => {
    const result = calculateXPFromFormConfig(
      { prayer: true },
      { questions: { prayer: { type: "BOOLEAN", xpYes: 20, xpNo: 0 } } },
    );
    expect(result).toBe(20);
  });

  it("handles legacy BOOLEAN no", () => {
    const result = calculateXPFromFormConfig(
      { prayer: false },
      { questions: { prayer: { type: "BOOLEAN", xpYes: 20, xpNo: 5 } } },
    );
    expect(result).toBe(5);
  });

  it("handles legacy NUMBER with multiplier and max", () => {
    const result = calculateXPFromFormConfig(
      { pages: 15 },
      { questions: { pages: { type: "NUMBER", multiplier: 3, max: 10 } } },
    );
    expect(result).toBe(30); // min(15, 10) * 3
  });

  it("handles legacy GRID with xpMap", () => {
    const result = calculateXPFromFormConfig(
      { quran: { row1: "full", row2: "half" } },
      {
        questions: {
          quran: {
            type: "GRID",
            xpMap: { full: 10, half: 5 },
          },
        },
      },
    );
    expect(result).toBe(15);
  });

  it("skips legacy entry when answer is missing", () => {
    const result = calculateXPFromFormConfig(
      {},
      { questions: { prayer: { type: "BOOLEAN", xpYes: 20, xpNo: 5 } } },
    );
    expect(result).toBe(0);
  });

  it("accumulates across multiple legacy questions", () => {
    const result = calculateXPFromFormConfig(
      { prayer: true, pages: 5 },
      {
        submitted_xp: 2,
        questions: {
          prayer: { type: "BOOLEAN", xpYes: 10, xpNo: 0 },
          pages: { type: "NUMBER", multiplier: 2, max: 10 },
        },
      },
    );
    expect(result).toBe(22); // 2 + 10 + 10
  });
});
