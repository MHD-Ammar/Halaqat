import { computeStreak } from "./streak.calculator";

const D = (dateStr: string) => new Date(`${dateStr}T00:00:00.000Z`);

describe("computeStreak", () => {
  it("first activity ever (no lastActivityDate) starts streak at 1", () => {
    const result = computeStreak({
      lastActivityDate: null,
      currentStreak: 0,
      today: D("2025-01-10"),
    });
    expect(result.newStreak).toBe(1);
    expect(result.wasContinued).toBe(false);
    expect(result.wasReset).toBe(false);
    expect(result.wasNoOp).toBe(false);
  });

  it("same-day re-submission is a no-op", () => {
    const result = computeStreak({
      lastActivityDate: D("2025-01-10"),
      currentStreak: 5,
      today: D("2025-01-10"),
    });
    expect(result.wasNoOp).toBe(true);
    expect(result.newStreak).toBe(5);
  });

  it("consecutive day continues streak", () => {
    const result = computeStreak({
      lastActivityDate: D("2025-01-09"),
      currentStreak: 4,
      today: D("2025-01-10"),
    });
    expect(result.wasContinued).toBe(true);
    expect(result.newStreak).toBe(5);
    expect(result.wasReset).toBe(false);
  });

  it("gap of 2 days resets streak to 1", () => {
    const result = computeStreak({
      lastActivityDate: D("2025-01-08"),
      currentStreak: 10,
      today: D("2025-01-10"),
    });
    expect(result.wasReset).toBe(true);
    expect(result.newStreak).toBe(1);
  });

  it("gap of more than 2 days resets streak to 1", () => {
    const result = computeStreak({
      lastActivityDate: D("2025-01-01"),
      currentStreak: 30,
      today: D("2025-01-10"),
    });
    expect(result.wasReset).toBe(true);
    expect(result.newStreak).toBe(1);
  });

  it("today is provided as a fixed date (timezone-edge: 23:59 then 00:01)", () => {
    // Activity at 2025-01-09 (23:59 local treated as UTC) then today is 2025-01-10
    const result = computeStreak({
      lastActivityDate: D("2025-01-09"),
      currentStreak: 1,
      today: D("2025-01-10"),
    });
    expect(result.wasContinued).toBe(true);
    expect(result.newStreak).toBe(2);
  });
});
