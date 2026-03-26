import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, IsNull, Repository } from "typeorm";

import { LeagueTier } from "./entities/league-tier.entity";
import { StudentLeague } from "./entities/student-league.entity";
import { Student } from "../students/entities/student.entity";

export interface LeagueLeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  totalXp: number;
  currentLevel: number;
  activeTitle: string | null;
  activeAvatarFrame: string | null;
  weeklyXp: number;
  promotionZone: boolean;
  relegationZone: boolean;
}

export interface LeagueLeaderboardResponse {
  leagueName: string;
  leagueNameAr: string;
  leagueIcon: string;
  leagueRank: number;
  weekEndsAt: string;
  students: LeagueLeaderboardEntry[];
  myRank: number;
  myWeeklyXp: number;
  promotionThreshold: number;
  relegationThreshold: number;
}

export interface LastWeekLeagueResultResponse {
  result: "promoted" | "relegated" | "stayed";
  finalRank: number | null;
  weeklyXp: number;
  weekStart: string;
  fromTier: {
    id: number;
    rank: number;
    name: string;
    nameAr: string;
    icon: string;
  };
  toTier: {
    id: number;
    rank: number;
    name: string;
    nameAr: string;
    icon: string;
  };
}

@Injectable()
export class LeagueService {
  private readonly logger = new Logger(LeagueService.name);

  constructor(
    @InjectRepository(LeagueTier)
    private readonly leagueTierRepo: Repository<LeagueTier>,
    @InjectRepository(StudentLeague)
    private readonly studentLeagueRepo: Repository<StudentLeague>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly dataSource: DataSource,
  ) {}

  private getUtcWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - day);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().split("T")[0]!;
  }

  private mapLegacyTierRankFromLevel(level: number): number {
    if (level >= 21) return 4;
    if (level >= 11) return 3;
    if (level >= 6) return 2;
    return 1;
  }

  private getZoneCounts(
    totalStudents: number,
    tier: LeagueTier,
    maxRank: number,
  ): { promotionCount: number; relegationCount: number } {
    const canPromote = tier.rank < maxRank;
    const canRelegate = tier.rank > 1 && totalStudents >= 2;

    const promotionCount = canPromote ? Math.min(tier.promotionSlots, totalStudents) : 0;
    const remainingAfterPromotion = Math.max(0, totalStudents - promotionCount);
    const relegationCount = canRelegate
      ? Math.min(tier.relegationSlots, remainingAfterPromotion)
      : 0;

    return { promotionCount, relegationCount };
  }

  async getOrCreateWeeklyLeague(studentId: string, mosqueId: string): Promise<StudentLeague> {
    const weekStartDate = this.getUtcWeekStart(new Date());
    const weekStart = this.toDateOnly(weekStartDate);

    const student = await this.studentRepo.findOne({
      where: { id: studentId, mosqueId },
      select: ["id", "currentLevel"],
    });
    if (!student) {
      throw new NotFoundException("Student not found");
    }

    const existing = await this.studentLeagueRepo.findOne({
      where: { studentId, weekStart },
      relations: ["tier"],
    });
    if (existing) {
      return existing;
    }

    const latestLeague = await this.studentLeagueRepo.findOne({
      where: { studentId },
      order: { weekStart: "DESC", createdAt: "DESC" },
    });

    let tierId = latestLeague?.tierId;
    if (!tierId) {
      const mappedRank = this.mapLegacyTierRankFromLevel(student.currentLevel);
      const mappedTier = await this.leagueTierRepo.findOne({
        where: { rank: mappedRank },
      });
      if (!mappedTier) {
        throw new NotFoundException("League tiers are not initialized");
      }
      tierId = mappedTier.id;
    }

    const created = this.studentLeagueRepo.create({
      studentId,
      tierId,
      weekStart,
      weeklyXp: 0,
      mosqueId,
      finalRank: null,
      result: null,
      resultSeenAt: null,
    });

    try {
      return await this.studentLeagueRepo.save(created);
    } catch (error) {
      // Handles race condition on unique(student_id, week_start)
      this.logger.warn(`League row race detected for student ${studentId}: ${String(error)}`);
      const concurrent = await this.studentLeagueRepo.findOne({
        where: { studentId, weekStart },
        relations: ["tier"],
      });
      if (!concurrent) throw error;
      return concurrent;
    }
  }

  async addWeeklyXp(studentId: string, xpAmount: number): Promise<void> {
    if (xpAmount <= 0) return;

    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      select: ["id", "mosqueId"],
    });
    if (!student) {
      throw new NotFoundException("Student not found");
    }

    const league = await this.getOrCreateWeeklyLeague(student.id, student.mosqueId);
    await this.studentLeagueRepo.increment({ id: league.id }, "weeklyXp", xpAmount);
  }

  async getLeagueLeaderboard(studentId: string, mosqueId: string): Promise<LeagueLeaderboardResponse> {
    const myLeague = await this.getOrCreateWeeklyLeague(studentId, mosqueId);

    const myLeagueWithTier = myLeague.tier
      ? myLeague
      : await this.studentLeagueRepo.findOne({
          where: { id: myLeague.id },
          relations: ["tier"],
        });

    if (!myLeagueWithTier?.tier) {
      throw new NotFoundException("League tier not found");
    }

    const tier = myLeagueWithTier.tier;
    const tiers = await this.leagueTierRepo.find({ order: { rank: "ASC" } });
    const maxRank = tiers.length > 0 ? tiers[tiers.length - 1]!.rank : 5;

    const rows = await this.studentLeagueRepo
      .createQueryBuilder("sl")
      .innerJoinAndSelect("sl.student", "student")
      .where("sl.mosque_id = :mosqueId", { mosqueId })
      .andWhere("sl.week_start = :weekStart", { weekStart: myLeagueWithTier.weekStart })
      .andWhere("sl.tier_id = :tierId", { tierId: tier.id })
      .orderBy("sl.weekly_xp", "DESC")
      .addOrderBy("sl.created_at", "ASC")
      .addOrderBy("student.id", "ASC")
      .getMany();

    const { promotionCount, relegationCount } = this.getZoneCounts(rows.length, tier, maxRank);
    const relegationStartIndex = rows.length - relegationCount;

    const students: LeagueLeaderboardEntry[] = rows.map((row, index) => ({
      rank: index + 1,
      id: row.student.id,
      name: row.student.name,
      totalXp: row.student.totalXp,
      currentLevel: row.student.currentLevel,
      activeTitle: row.student.activeTitle,
      activeAvatarFrame: row.student.activeAvatarFrame,
      weeklyXp: row.weeklyXp,
      promotionZone: index < promotionCount,
      relegationZone: index >= relegationStartIndex && relegationCount > 0,
    }));

    const myRank = students.findIndex((s) => s.id === studentId) + 1;
    const myEntry = students.find((s) => s.id === studentId);

    const promotionThreshold = promotionCount > 0 ? students[promotionCount - 1]!.weeklyXp : 0;
    const relegationThreshold =
      relegationCount > 0 ? students[relegationStartIndex]!.weeklyXp : 0;

    const weekStartDate = new Date(`${myLeagueWithTier.weekStart}T00:00:00.000Z`);
    const weekEndsAt = this.addDays(weekStartDate, 7).toISOString();

    return {
      leagueName: tier.name,
      leagueNameAr: tier.nameAr,
      leagueIcon: tier.icon,
      leagueRank: tier.rank,
      weekEndsAt,
      students,
      myRank: Math.max(myRank, 0),
      myWeeklyXp: myEntry?.weeklyXp ?? 0,
      promotionThreshold,
      relegationThreshold,
    };
  }

  async processWeeklyReset(): Promise<{ weekStart: string; nextWeekStart: string; processed: number }> {
    const currentWeekStartDate = this.getUtcWeekStart(new Date());
    const previousWeekStartDate = this.addDays(currentWeekStartDate, -7);

    const weekStart = this.toDateOnly(previousWeekStartDate);
    const nextWeekStart = this.toDateOnly(currentWeekStartDate);

    const tiers = await this.leagueTierRepo.find({ order: { rank: "ASC" } });
    if (tiers.length === 0) {
      throw new NotFoundException("League tiers are not initialized");
    }

    const tierById = new Map(tiers.map((tier) => [tier.id, tier]));
    const tierByRank = new Map(tiers.map((tier) => [tier.rank, tier]));
    const maxRank = tiers[tiers.length - 1]!.rank;

    const weekRows = await this.studentLeagueRepo.find({
      where: { weekStart, result: IsNull() },
      order: { createdAt: "ASC" },
    });

    if (weekRows.length === 0) {
      return { weekStart, nextWeekStart, processed: 0 };
    }

    const groups = new Map<string, StudentLeague[]>();
    for (const row of weekRows) {
      const key = `${row.mosqueId}:${row.tierId}`;
      const list = groups.get(key);
      if (list) {
        list.push(row);
      } else {
        groups.set(key, [row]);
      }
    }

    await this.dataSource.transaction(async (manager) => {
      const updatedRows: StudentLeague[] = [];
      const nextWeekRows: Array<Partial<StudentLeague>> = [];
      const bonusByStudent = new Map<string, number>();

      for (const rows of groups.values()) {
        const tier = tierById.get(rows[0]!.tierId);
        if (!tier) continue;

        rows.sort((a, b) => {
          if (b.weeklyXp !== a.weeklyXp) return b.weeklyXp - a.weeklyXp;
          const createdDiff = a.createdAt.getTime() - b.createdAt.getTime();
          if (createdDiff !== 0) return createdDiff;
          return a.studentId.localeCompare(b.studentId);
        });

        const { promotionCount, relegationCount } = this.getZoneCounts(rows.length, tier, maxRank);
        const relegationStartIndex = rows.length - relegationCount;

        for (let index = 0; index < rows.length; index++) {
          const row = rows[index]!;

          let result: "promoted" | "relegated" | "stayed" = "stayed";
          if (index < promotionCount) {
            result = "promoted";
          } else if (index >= relegationStartIndex && relegationCount > 0) {
            result = "relegated";
          }

          row.finalRank = index + 1;
          row.result = result;
          row.resultSeenAt = null;
          updatedRows.push(row);

          if (index < 3 && tier.xpBonus > 0) {
            bonusByStudent.set(row.studentId, (bonusByStudent.get(row.studentId) ?? 0) + tier.xpBonus);
          }

          let nextRank = tier.rank;
          if (result === "promoted") {
            nextRank = Math.min(maxRank, tier.rank + 1);
          } else if (result === "relegated") {
            nextRank = Math.max(1, tier.rank - 1);
          }

          const nextTier = tierByRank.get(nextRank) ?? tier;
          nextWeekRows.push({
            studentId: row.studentId,
            tierId: nextTier.id,
            weekStart: nextWeekStart,
            weeklyXp: 0,
            finalRank: null,
            result: null,
            resultSeenAt: null,
            mosqueId: row.mosqueId,
          });
        }
      }

      if (updatedRows.length > 0) {
        await manager.save(StudentLeague, updatedRows);
      }

      for (const [studentId, bonusXp] of bonusByStudent.entries()) {
        await manager.increment(Student, { id: studentId }, "totalXp", bonusXp);
      }

      if (nextWeekRows.length > 0) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(StudentLeague)
          .values(nextWeekRows)
          .orIgnore()
          .execute();
      }
    });

    return { weekStart, nextWeekStart, processed: weekRows.length };
  }

  async getLastWeekResult(
    studentId: string,
    mosqueId: string,
  ): Promise<LastWeekLeagueResultResponse | null> {
    const currentWeekStartDate = this.getUtcWeekStart(new Date());
    const previousWeekStart = this.toDateOnly(this.addDays(currentWeekStartDate, -7));

    const row = await this.studentLeagueRepo.findOne({
      where: {
        studentId,
        mosqueId,
        weekStart: previousWeekStart,
        result: IsNull(),
      },
    });

    if (row) {
      // If the previous week row is still open, reset was not processed yet.
      return null;
    }

    const lastWeek = await this.studentLeagueRepo.findOne({
      where: {
        studentId,
        mosqueId,
        weekStart: previousWeekStart,
        resultSeenAt: IsNull(),
      },
      relations: ["tier"],
      order: { createdAt: "DESC" },
    });

    if (!lastWeek || !lastWeek.result || !lastWeek.tier) {
      return null;
    }

    const tiers = await this.leagueTierRepo.find({ order: { rank: "ASC" } });
    const maxRank = tiers.length > 0 ? tiers[tiers.length - 1]!.rank : 5;
    const tierByRank = new Map(tiers.map((tier) => [tier.rank, tier]));

    let toRank = lastWeek.tier.rank;
    if (lastWeek.result === "promoted") {
      toRank = Math.min(maxRank, lastWeek.tier.rank + 1);
    } else if (lastWeek.result === "relegated") {
      toRank = Math.max(1, lastWeek.tier.rank - 1);
    }
    const toTier = tierByRank.get(toRank) ?? lastWeek.tier;

    return {
      result: lastWeek.result,
      finalRank: lastWeek.finalRank,
      weeklyXp: lastWeek.weeklyXp,
      weekStart: lastWeek.weekStart,
      fromTier: {
        id: lastWeek.tier.id,
        rank: lastWeek.tier.rank,
        name: lastWeek.tier.name,
        nameAr: lastWeek.tier.nameAr,
        icon: lastWeek.tier.icon,
      },
      toTier: {
        id: toTier.id,
        rank: toTier.rank,
        name: toTier.name,
        nameAr: toTier.nameAr,
        icon: toTier.icon,
      },
    };
  }

  async markLastWeekResultSeen(studentId: string, mosqueId: string): Promise<{ success: true }> {
    const currentWeekStartDate = this.getUtcWeekStart(new Date());
    const previousWeekStart = this.toDateOnly(this.addDays(currentWeekStartDate, -7));

    const row = await this.studentLeagueRepo.findOne({
      where: {
        studentId,
        mosqueId,
        weekStart: previousWeekStart,
        resultSeenAt: IsNull(),
      },
    });

    if (!row || !row.result) {
      return { success: true };
    }

    row.resultSeenAt = new Date();
    await this.studentLeagueRepo.save(row);

    return { success: true };
  }
}
