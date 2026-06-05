import { Injectable, NotFoundException } from "@nestjs/common";
import { EntityManager } from "typeorm";

import { getTitleKeyForLevel } from "../../common/constants/student-titles";
import { SeasonalEventService } from "../../gamification/seasonal-event.service";
import { Student } from "../../students/entities/student.entity";
import { LevelTransition, diffLevels } from "../calculators/level.calculator";
import { XpAwardResult, computeXpAward } from "../calculators/xp.calculator";

export type XpGrantResult = XpAwardResult & { transition: LevelTransition; newTotalXp: number };

@Injectable()
export class XpAwardService {
  constructor(private readonly eventService: SeasonalEventService) {}

  async awardXp(
    manager: EntityManager,
    studentId: string,
    baseXp: number,
    opts?: { questId?: string },
  ): Promise<XpGrantResult> {
    const student = await manager.findOne(Student, {
      where: { id: studentId },
      lock: { mode: "pessimistic_write" },
    });
    if (!student) throw new NotFoundException("Student not found");

    const activeEvent = await this.eventService.getActiveEvent(student.mosqueId);
    const eventMultiplier = activeEvent?.xpMultiplier ?? 1.0;

    let effectiveBaseXp = baseXp;
    if (opts?.questId) {
      effectiveBaseXp += await this.eventService.getQuestBonusXp(student.mosqueId, opts.questId);
    }

    const xpResult = computeXpAward({
      baseXp: effectiveBaseXp,
      streakDays: student.currentStreak,
      eventMultiplier,
    });

    const oldXp = student.totalXp;
    student.totalXp += xpResult.finalXp;

    const transition = diffLevels(oldXp, student.totalXp);
    student.currentLevel = transition.newLevel;

    if (transition.leveledUp) {
      student.activeTitle = getTitleKeyForLevel(transition.newLevel);
    }

    await manager.save(student);

    return { ...xpResult, transition, newTotalXp: student.totalXp };
  }
}
