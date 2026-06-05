/**
 * QuestSubmissionService — getProgressInWindow & getDateBounds tests
 *
 * `getProgressInWindow` is the core of the Task-46 fix: it prevents DAILY
 * quest progress from "bleeding" across UTC midnight by filtering in-progress
 * records using `createdAt` instead of trusting they belong to today.
 *
 * Both helpers are tested via the public `getDateBounds` accessor and by
 * calling `getProgressInWindow` directly (it is private but accessible via
 * a typed cast in unit-test context).
 */

import { QuestFrequency } from "@halaqat/types";

// ── Minimal stubs so NestJS DI is never invoked ───────────────────────────────

const makeRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

let QuestSubmissionService: any;

beforeAll(async () => {
  ({ QuestSubmissionService } = await import("./quest-submission.service"));
});

function makeService() {
  // Pass stub repos for all four @InjectRepository params
  return new QuestSubmissionService(
    makeRepo(), // Quest
    makeRepo(), // QuestCompletion
    makeRepo(), // Student
    makeRepo(), // Campaign
  );
}

// ── Helper builders ───────────────────────────────────────────────────────────

type Freq = "DAILY" | "WEEKLY" | "ONETIME";

function makeQuest(frequency: Freq) {
  return { frequency } as any;
}

function completion(opts: {
  currentProgress: number;
  completedAt?: Date | null;
  createdAt?: Date;
}) {
  return {
    currentProgress: opts.currentProgress,
    completedAt: opts.completedAt ?? null,
    createdAt: opts.createdAt,
  } as any;
}

// Build UTC-midnight boundaries for an arbitrary date string ("YYYY-MM-DD")
function bounds(dateStr: string) {
  const todayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const todayEnd = new Date(`${dateStr}T23:59:59.999Z`);
  const weekStart = new Date(todayStart);
  const weekEnd = new Date(todayEnd);
  return { todayStart, todayEnd, weekStart, weekEnd };
}

// ── getDateBounds ──────────────────────────────────────────────────────────────

describe("QuestSubmissionService.getDateBounds", () => {
  it("returns todayStart at UTC midnight", () => {
    const svc = makeService();
    const { todayStart } = svc.getDateBounds();
    expect(todayStart.getUTCHours()).toBe(0);
    expect(todayStart.getUTCMinutes()).toBe(0);
    expect(todayStart.getUTCSeconds()).toBe(0);
    expect(todayStart.getUTCMilliseconds()).toBe(0);
  });

  it("returns todayEnd at 23:59:59.999 UTC", () => {
    const svc = makeService();
    const { todayEnd } = svc.getDateBounds();
    expect(todayEnd.getUTCHours()).toBe(23);
    expect(todayEnd.getUTCMinutes()).toBe(59);
    expect(todayEnd.getUTCSeconds()).toBe(59);
    expect(todayEnd.getUTCMilliseconds()).toBe(999);
  });

  it("todayStart and todayEnd share the same UTC date string", () => {
    const svc = makeService();
    const { todayStart, todayEnd } = svc.getDateBounds();
    const startDate = todayStart.toISOString().split("T")[0];
    const endDate = todayEnd.toISOString().split("T")[0];
    expect(startDate).toBe(endDate);
  });

  it("weekStart is on Sunday (UTC day 0)", () => {
    const svc = makeService();
    const { weekStart } = svc.getDateBounds();
    expect(weekStart.getUTCDay()).toBe(0);
  });

  it("weekEnd is exactly 6 days after weekStart", () => {
    const svc = makeService();
    const { weekStart, weekEnd } = svc.getDateBounds();
    const diffMs = weekEnd.getTime() - weekStart.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    // 6 full days + 23:59:59.999 = slightly under 7 days
    expect(diffDays).toBeGreaterThanOrEqual(6);
    expect(diffDays).toBeLessThan(7);
  });
});

// ── getProgressInWindow — DAILY ────────────────────────────────────────────────

describe("QuestSubmissionService.getProgressInWindow — DAILY quest", () => {
  const DATE = "2026-05-09";
  const { todayStart, todayEnd, weekStart, weekEnd } = bounds(DATE);
  const quest = makeQuest("DAILY");

  // Helper: call the private method through a cast
  function progress(svc: any, completions: any[]) {
    return (svc as any).getProgressInWindow(quest, completions, todayStart, todayEnd, weekStart, weekEnd);
  }

  it("returns 0 for empty completions array", () => {
    const svc = makeService();
    expect(progress(svc, [])).toBe(0);
  });

  it("returns 0 when completed record is from yesterday (outside today window)", () => {
    const svc = makeService();
    const yesterday = new Date(`2026-05-08T12:00:00.000Z`);
    const c = completion({ currentProgress: 5, completedAt: yesterday });
    expect(progress(svc, [c])).toBe(0);
  });

  it("returns progress when completed record is from today", () => {
    const svc = makeService();
    const todayNoon = new Date(`${DATE}T12:00:00.000Z`);
    const c = completion({ currentProgress: 3, completedAt: todayNoon });
    expect(progress(svc, [c])).toBe(3);
  });

  it("returns max progress across multiple today-completed records", () => {
    const svc = makeService();
    const todayNoon = new Date(`${DATE}T12:00:00.000Z`);
    const c1 = completion({ currentProgress: 2, completedAt: todayNoon });
    const c2 = completion({ currentProgress: 7, completedAt: todayNoon });
    expect(progress(svc, [c1, c2])).toBe(7);
  });

  it("excludes yesterday's in-progress record (Task-46 bleed-over fix)", () => {
    const svc = makeService();
    // In-progress from yesterday — createdAt outside today window
    const yesterdayStart = new Date(`2026-05-08T09:00:00.000Z`);
    const c = completion({ currentProgress: 4, completedAt: null, createdAt: yesterdayStart });
    expect(progress(svc, [c])).toBe(0);
  });

  it("includes today's in-progress record (createdAt within today window)", () => {
    const svc = makeService();
    const todayMorning = new Date(`${DATE}T08:00:00.000Z`);
    const c = completion({ currentProgress: 2, completedAt: null, createdAt: todayMorning });
    expect(progress(svc, [c])).toBe(2);
  });

  it("bleed-over scenario: yesterday in-progress + today in-progress returns only today's progress", () => {
    const svc = makeService();
    const yesterday = new Date(`2026-05-08T22:00:00.000Z`);
    const todayMorning = new Date(`${DATE}T07:00:00.000Z`);
    const oldRecord = completion({ currentProgress: 9, completedAt: null, createdAt: yesterday });
    const newRecord = completion({ currentProgress: 1, completedAt: null, createdAt: todayMorning });
    // Without the fix, max would return 9; with the fix it returns 1
    expect(progress(svc, [oldRecord, newRecord])).toBe(1);
  });

  it("falls back to including in-progress record when createdAt is absent", () => {
    const svc = makeService();
    // No createdAt — should be included as fallback (defensive)
    const c = completion({ currentProgress: 5, completedAt: null });
    expect(progress(svc, [c])).toBe(5);
  });

  it("ignores completed records from tomorrow (future)", () => {
    const svc = makeService();
    const tomorrow = new Date(`2026-05-10T01:00:00.000Z`);
    const c = completion({ currentProgress: 8, completedAt: tomorrow });
    expect(progress(svc, [c])).toBe(0);
  });
});

// ── getProgressInWindow — WEEKLY ───────────────────────────────────────────────

describe("QuestSubmissionService.getProgressInWindow — WEEKLY quest", () => {
  const quest = makeQuest("WEEKLY");

  // Use a fixed Sunday as weekStart
  const weekStart = new Date("2026-05-03T00:00:00.000Z"); // Sunday
  const weekEnd = new Date("2026-05-09T23:59:59.999Z");   // Saturday
  const todayStart = new Date("2026-05-09T00:00:00.000Z");
  const todayEnd = new Date("2026-05-09T23:59:59.999Z");

  function progress(svc: any, completions: any[]) {
    return (svc as any).getProgressInWindow(quest, completions, todayStart, todayEnd, weekStart, weekEnd);
  }

  it("includes completion from mid-week", () => {
    const svc = makeService();
    const wednesday = new Date("2026-05-06T12:00:00.000Z");
    const c = completion({ currentProgress: 6, completedAt: wednesday });
    expect(progress(svc, [c])).toBe(6);
  });

  it("excludes completion from previous week", () => {
    const svc = makeService();
    const lastSaturday = new Date("2026-05-02T23:59:59.000Z");
    const c = completion({ currentProgress: 10, completedAt: lastSaturday });
    expect(progress(svc, [c])).toBe(0);
  });

  it("includes in-progress record created within this week", () => {
    const svc = makeService();
    const tuesday = new Date("2026-05-05T09:00:00.000Z");
    const c = completion({ currentProgress: 3, completedAt: null, createdAt: tuesday });
    expect(progress(svc, [c])).toBe(3);
  });

  it("excludes in-progress record created last week", () => {
    const svc = makeService();
    const lastWeek = new Date("2026-04-28T10:00:00.000Z");
    const c = completion({ currentProgress: 5, completedAt: null, createdAt: lastWeek });
    expect(progress(svc, [c])).toBe(0);
  });
});

// ── getProgressInWindow — ONETIME ──────────────────────────────────────────────

describe("QuestSubmissionService.getProgressInWindow — ONETIME quest", () => {
  const quest = makeQuest("ONETIME");
  const { todayStart, todayEnd, weekStart, weekEnd } = bounds("2026-05-09");

  function progress(svc: any, completions: any[]) {
    return (svc as any).getProgressInWindow(quest, completions, todayStart, todayEnd, weekStart, weekEnd);
  }

  it("includes any completion regardless of timestamp", () => {
    const svc = makeService();
    const longAgo = new Date("2024-01-01T00:00:00.000Z");
    const c = completion({ currentProgress: 1, completedAt: longAgo });
    expect(progress(svc, [c])).toBe(1);
  });

  it("includes in-progress ONETIME record from any time", () => {
    const svc = makeService();
    const lastYear = new Date("2025-03-15T00:00:00.000Z");
    const c = completion({ currentProgress: 4, completedAt: null, createdAt: lastYear });
    expect(progress(svc, [c])).toBe(4);
  });

  it("returns max across multiple ONETIME completions", () => {
    const svc = makeService();
    const c1 = completion({ currentProgress: 2, completedAt: new Date("2024-01-01T00:00:00.000Z") });
    const c2 = completion({ currentProgress: 9, completedAt: new Date("2025-06-01T00:00:00.000Z") });
    expect(progress(svc, [c1, c2])).toBe(9);
  });
});
