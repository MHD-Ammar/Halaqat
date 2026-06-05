import { diffLevels, calculateLevelFromXp, XP_LEVEL_CURVE } from "./level.calculator";

describe("diffLevels", () => {
  it("returns same level with no change when XP doesn't cross a threshold", () => {
    const result = diffLevels(0, 50);
    expect(result.leveledUp).toBe(false);
    expect(result.levelsGained).toBe(0);
    expect(result.oldLevel).toBe(result.newLevel);
  });

  it("detects a single level-up", () => {
    // Level 1 → Level 2 at 100 XP
    const result = diffLevels(99, 100);
    expect(result.leveledUp).toBe(true);
    expect(result.levelsGained).toBe(1);
    expect(result.oldLevel).toBe(1);
    expect(result.newLevel).toBe(2);
  });

  it("detects a multi-level jump", () => {
    // 0 XP (level 1) → 1000 XP (level 5)
    const result = diffLevels(0, 1000);
    expect(result.leveledUp).toBe(true);
    expect(result.levelsGained).toBeGreaterThan(1);
    expect(result.newLevel).toBe(5);
  });

  it("handles exact threshold XP", () => {
    // Exactly at level 2 threshold (100 XP)
    const result = diffLevels(0, XP_LEVEL_CURVE[1]!);
    expect(result.newLevel).toBe(2);
    expect(result.leveledUp).toBe(true);
  });

  it("returns level 1 for zero XP input", () => {
    const result = diffLevels(0, 0);
    expect(result.oldLevel).toBe(1);
    expect(result.newLevel).toBe(1);
    expect(result.leveledUp).toBe(false);
  });
});

describe("calculateLevelFromXp", () => {
  it("returns level 1 for 0 XP", () => {
    expect(calculateLevelFromXp(0)).toBe(1);
  });

  it("returns level 1 for XP below first threshold", () => {
    expect(calculateLevelFromXp(99)).toBe(1);
  });

  it("returns max level for very high XP", () => {
    expect(calculateLevelFromXp(99999)).toBe(XP_LEVEL_CURVE.length);
  });
});
