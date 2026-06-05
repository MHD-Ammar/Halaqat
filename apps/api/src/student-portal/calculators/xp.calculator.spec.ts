import { computeXpAward } from "./xp.calculator";

describe("computeXpAward", () => {
  it("returns baseXp when no streak and no event multiplier", () => {
    const result = computeXpAward({ baseXp: 100, streakDays: 0, eventMultiplier: 1.0 });
    expect(result.finalXp).toBe(100);
    expect(result.streakMultiplier).toBe(1.0);
    expect(result.breakdown.streakBonus).toBe(0);
    expect(result.breakdown.eventBonus).toBe(0);
  });

  it("returns 0 finalXp for zero baseXp", () => {
    const result = computeXpAward({ baseXp: 0, streakDays: 10, eventMultiplier: 1.5 });
    expect(result.finalXp).toBe(0);
    expect(result.breakdown.base).toBe(0);
  });

  it("applies 1.2x streak multiplier at streak day 3", () => {
    const result = computeXpAward({ baseXp: 100, streakDays: 3, eventMultiplier: 1.0 });
    expect(result.streakMultiplier).toBe(1.2);
    expect(result.finalXp).toBe(120);
    expect(result.breakdown.streakBonus).toBe(20);
    expect(result.breakdown.eventBonus).toBe(0);
  });

  it("applies 1.5x streak multiplier at streak day 7", () => {
    const result = computeXpAward({ baseXp: 100, streakDays: 7, eventMultiplier: 1.0 });
    expect(result.streakMultiplier).toBe(1.5);
    expect(result.finalXp).toBe(150);
  });

  it("applies 2.0x streak multiplier at streak day 30", () => {
    const result = computeXpAward({ baseXp: 100, streakDays: 30, eventMultiplier: 1.0 });
    expect(result.streakMultiplier).toBe(2.0);
    expect(result.finalXp).toBe(200);
  });

  it("applies event multiplier when active (no streak)", () => {
    const result = computeXpAward({ baseXp: 100, streakDays: 0, eventMultiplier: 1.5 });
    expect(result.finalXp).toBe(150);
    expect(result.breakdown.eventBonus).toBe(50);
  });

  it("compounds streak and event multipliers", () => {
    // streak 7 days = 1.5x, event 1.5x → 100 * 1.5 * 1.5 = 225
    const result = computeXpAward({ baseXp: 100, streakDays: 7, eventMultiplier: 1.5 });
    expect(result.finalXp).toBe(225);
    expect(result.breakdown.base).toBe(100);
    expect(result.breakdown.streakBonus).toBe(50);  // 150 - 100
    expect(result.breakdown.eventBonus).toBe(75);   // 225 - 150
  });

  it("rounds finalXp to nearest integer", () => {
    // 10 * 1.2 * 1.5 = 18.0 exactly
    const result = computeXpAward({ baseXp: 10, streakDays: 3, eventMultiplier: 1.5 });
    expect(Number.isInteger(result.finalXp)).toBe(true);
  });

  it("throws for negative baseXp", () => {
    expect(() => computeXpAward({ baseXp: -1, streakDays: 0, eventMultiplier: 1.0 })).toThrow();
  });
});
