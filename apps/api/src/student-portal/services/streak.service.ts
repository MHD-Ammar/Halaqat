import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { EntityManager } from "typeorm";

import { DailySubmission } from "../../daily-challenge/entities/daily-submission.entity";
import { Student } from "../../students/entities/student.entity";
import { computeStreak } from "../calculators/streak.calculator";

const SHIELD_REWARD_STREAKS = [7, 14, 21, 30];
const MAX_SHIELDS = 3;

/** Validates that a string is a zero-padded ISO date (YYYY-MM-DD). */
function assertIsoDate(value: string, paramName = "today"): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(
      `${paramName} must be a zero-padded ISO date (YYYY-MM-DD), received: "${value}"`,
    );
  }
  const ts = Date.parse(`${value}T00:00:00Z`);
  if (isNaN(ts)) {
    throw new BadRequestException(
      `${paramName} is not a valid calendar date: "${value}"`,
    );
  }
}

@Injectable()
export class StreakService {
  /**
   * Records a daily activity for streak tracking.
   * Consumes a shield if yesterday was missed but shields remain.
   * Awards a shield at streak milestones (7/14/21/30 days).
   * Must be called AFTER XP is awarded so the multiplier uses the pre-activity streak.
   *
   * @param today - Zero-padded ISO date string (YYYY-MM-DD) in UTC.
   *   The caller is responsible for supplying the correct UTC date.
   *   Note: submitting at 01:00 local time in UTC+3 is 22:00 the previous
   *   UTC day — callers should use dto.localDate (device-local date) when
   *   available to avoid off-by-one errors at midnight.
   */
  async recordActivity(
    manager: EntityManager,
    studentId: string,
    today: string,
    campaignId: string,
  ): Promise<{ newStreak: number; shieldUsed: boolean; shieldEarned: boolean }> {
    // Guard against silent NaN from malformed dates (e.g. "2026-5-9" missing zero-padding)
    assertIsoDate(today, "today");

    const yesterdayDate = new Date(`${today}T00:00:00Z`);
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0]!;

    const student = await manager.findOne(Student, {
      where: { id: studentId },
      lock: { mode: "pessimistic_write" },
    });
    if (!student) throw new NotFoundException("Student not found");

    const previousSubmission = await manager.findOne(DailySubmission, {
      where: { studentId, submissionDate: yesterdayStr, campaignId },
    });

    let shieldUsed = false;
    let lastActivityDate: Date | null = previousSubmission
      ? new Date(`${yesterdayStr}T00:00:00Z`)
      : null;

    if (!previousSubmission && student.streakShields > 0 && student.currentStreak > 0) {
      student.streakShields -= 1;
      student.lastShieldUsedAt = new Date();
      shieldUsed = true;
      lastActivityDate = new Date(`${yesterdayStr}T00:00:00Z`);
    }

    const { newStreak } = computeStreak({
      lastActivityDate,
      currentStreak: student.currentStreak,
      today: new Date(`${today}T00:00:00Z`),
    });

    student.currentStreak = newStreak;
    if (newStreak > student.maxStreak) {
      student.maxStreak = newStreak;
    }

    const shieldEarned =
      SHIELD_REWARD_STREAKS.includes(newStreak) && student.streakShields < MAX_SHIELDS;
    if (shieldEarned) {
      student.streakShields += 1;
    }

    student.lastLoginAt = new Date();
    await manager.save(student);

    return { newStreak, shieldUsed, shieldEarned };
  }
}
