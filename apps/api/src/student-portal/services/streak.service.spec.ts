/**
 * StreakService — assertIsoDate guard tests
 *
 * `assertIsoDate` is a module-private helper but its behaviour is the core
 * of the Task-46 fix.  We test it indirectly through `recordActivity` by
 * checking that BadRequestException is thrown for malformed dates and that
 * correctly-formatted dates pass validation (EntityManager call is mocked).
 */

import { jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";

// ── Minimal EntityManager stub ────────────────────────────────────────────────

const makeManager = () => ({
  findOne: jest.fn().mockResolvedValue(null), // returns null → NotFoundException
  save: jest.fn(),
  query: jest.fn(),
});

let StreakService: any;

beforeAll(async () => {
  ({ StreakService } = await import("./streak.service"));
});

function makeService() {
  return new StreakService();
}

describe("StreakService.recordActivity — ISO date validation", () => {
  const STUDENT_ID = "student-uuid";
  const CAMPAIGN_ID = "campaign-uuid";

  it("throws BadRequestException for missing zero-padding (month)", async () => {
    const svc = makeService();
    const manager = makeManager();

    await expect(
      svc.recordActivity(manager, STUDENT_ID, "2026-5-09", CAMPAIGN_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it("throws BadRequestException for missing zero-padding (day)", async () => {
    const svc = makeService();
    const manager = makeManager();

    await expect(
      svc.recordActivity(manager, STUDENT_ID, "2026-05-9", CAMPAIGN_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it("throws BadRequestException for completely invalid date string", async () => {
    const svc = makeService();
    const manager = makeManager();

    await expect(
      svc.recordActivity(manager, STUDENT_ID, "not-a-date", CAMPAIGN_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it("throws BadRequestException for impossible calendar date", async () => {
    const svc = makeService();
    const manager = makeManager();

    await expect(
      svc.recordActivity(manager, STUDENT_ID, "2026-13-01", CAMPAIGN_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it("passes date validation for a well-formed ISO date (then fails on student lookup)", async () => {
    const svc = makeService();
    const manager = makeManager();
    // findOne returns null → NotFoundException (not BadRequestException)
    // This confirms assertIsoDate passed and we reached the DB layer.
    const { NotFoundException } = await import("@nestjs/common");

    await expect(
      svc.recordActivity(manager, STUDENT_ID, "2026-05-09", CAMPAIGN_ID),
    ).rejects.toThrow(NotFoundException);
  });
});
