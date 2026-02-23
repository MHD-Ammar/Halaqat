/**
 * Student Portal Service
 *
 * Handles gamification logic for the student portal:
 * - Daily quests submission
 * - XP calculation and accumulation
 * - Level calculation based on XP thresholds
 * - Streak calculation and maintenance
 * - Atomic database transactions for data integrity
 */

import { FormQuestion } from "@halaqat/types";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { SubmitStudentQuestDto } from "./dto/submit-student-quest.dto";
import { Campaign } from "../daily-challenge/entities/campaign.entity";
import { DailySubmission } from "../daily-challenge/entities/daily-submission.entity";
import { Recitation } from "../progress/entities/recitation.entity";
import { Student } from "../students/entities/student.entity";

@Injectable()
export class StudentPortalService {
  /**
   * XP thresholds for leveling.
   * Formula: totalXp / 500 + 1 (e.g., 0-499 XP = Level 1, 500-999 = Level 2, etc.)
   */
  private readonly XP_PER_LEVEL = 500;

  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(DailySubmission)
    private submissionRepo: Repository<DailySubmission>,
    @InjectRepository(Recitation)
    private recitationRepo: Repository<Recitation>,
    @InjectRepository(Campaign)
    private campaignRepo: Repository<Campaign>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get today's quest status for a student
   * Returns whether they've submitted today and earned XP, plus the active campaign config
   */
  async getTodayQuests(studentId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    const activeCampaign = await this.campaignRepo.findOne({
      where: { isActive: true },
      order: { createdAt: "DESC" },
    });

    if (!activeCampaign) {
      // If no active campaign, simply return a gracefully handled "no quests" state
      return {
        hasSubmittedToday: false,
        todayXpEarned: undefined,
        config: null,
      };
    }

    const today = new Date().toISOString().split("T")[0];

    const submission = await this.submissionRepo.findOne({
      where: {
        studentId,
        submissionDate: today,
        campaignId: activeCampaign.id,
      },
    });

    const hasSubmittedToday = !!submission;
    const todayXpEarned = submission?.xpEarned || undefined;

    return {
      hasSubmittedToday,
      todayXpEarned,
      config: activeCampaign.formConfig,
      campaignId: activeCampaign.id,
    };
  }

  /**
   * Claim daily login bonus
   * Awards 20 XP if the student hasn't claimed it today
   */
  async claimLoginBonus(studentId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // If already claimed today
    if (student.lastLoginBonusAt && student.lastLoginBonusAt >= todayStart) {
      return { claimed: false };
    }

    const xpAwarded = 20;
    student.totalXp += xpAwarded;

    const oldLevel = student.currentLevel;
    const newLevel = this.calculateLevel(student.totalXp);
    const levelUp = newLevel > oldLevel;
    student.currentLevel = newLevel;

    student.lastLoginBonusAt = new Date();

    await this.studentRepo.save(student);

    return {
      claimed: true,
      xpAwarded,
      newTotalXp: student.totalXp,
      levelUp,
      newLevel,
    };
  }

  /**
   * Get student dashboard aggregated data
   */
  async getDashboardData(studentId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      select: ["id", "totalXp", "currentLevel", "currentStreak"],
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    const today = new Date();
    const last7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]!);
    }

    const activeCampaign = await this.campaignRepo.findOne({
      where: { isActive: true },
      order: { createdAt: "DESC" },
    });

    const query = this.submissionRepo
      .createQueryBuilder("sub")
      .where("sub.student_id = :studentId", { studentId })
      .andWhere("sub.submission_date IN (:...dates)", { dates: last7Days });

    if (activeCampaign) {
      query.andWhere("sub.campaign_id = :campaignId", { campaignId: activeCampaign.id });
    } else {
      query.andWhere("1 = 0"); // Return no submissions if no active campaign
    }

    const recentSubmissions = await query.getMany();

    const streakCalendar: Record<string, boolean> = {};
    for (const date of last7Days) {
      streakCalendar[date] = false;
    }
    for (const sub of recentSubmissions) {
      streakCalendar[sub.submissionDate] = true;
    }

    const recentRecitations = await this.recitationRepo.find({
      where: { studentId },
      relations: ["session", "surah"],
      order: { createdAt: "DESC" },
      take: 3,
    });

    const formattedRecitations = recentRecitations.map((r) => ({
      date: r.session?.date,
      surah: r.surah?.nameArabic || "Unknown",
      quality: r.quality,
      mistakesCount: r.mistakesCount,
      type: r.type,
    }));

    const todayStr = today.toISOString().split("T")[0]!;
    const hasSubmittedToday = streakCalendar[todayStr] ?? false;

    return {
      streakCalendar,
      recentRecitations: formattedRecitations,
      hasSubmittedToday,
      currentStreak: student.currentStreak,
      totalXp: student.totalXp,
      currentLevel: student.currentLevel,
    };
  }

  /**
   * Submit a daily quest with full gamification transaction
   *
   * CRITICAL: Uses TypeORM transaction to ensure atomicity:
   * 1. Validate student hasn't submitted today
   * 2. Calculate XP earned
   * 3. Create DailySubmission record
   * 4. Update Student with XP, Level, and Streak
   * 5. Save all changes atomically
   */
  async submitQuest(
    studentId: string,
    dto: SubmitStudentQuestDto,
  ) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    // Use provided campaignId or fall back to active campaign
    const campaign = dto.campaignId
      ? await this.campaignRepo.findOne({ where: { id: dto.campaignId } })
      : await this.campaignRepo.findOne({
          where: { isActive: true },
          order: { createdAt: "DESC" },
        });

    if (!campaign) {
      throw new BadRequestException(dto.campaignId ? "Campaign not found" : "No active campaign found");
    }

    const campaignId = campaign.id;
    const formConfig = campaign.formConfig;

    if (!formConfig || typeof formConfig !== "object") {
      throw new BadRequestException("Invalid campaign config");
    }

    // Use provided date or default to today
    const today = dto.localDate ?? new Date().toISOString().split("T")[0]!;

    // Check if already submitted today
    const existingSubmission = await this.submissionRepo.findOne({
      where: {
        studentId,
        submissionDate: today,
        campaignId,
      },
    });

    if (existingSubmission) {
      throw new BadRequestException("You have already submitted for today!");
    }

    // Calculate XP from campaign formConfig (FormQuestion[] or legacy CampaignConfig)
    const xpEarned = this.calculateXPFromFormConfig(dto.submissionData, formConfig);

    // Calculate streak - campaignId is guaranteed to be a string at this point
    const newStreak = await this.calculateStreak(
      studentId,
      today,
      campaignId,
    );

    // === TRANSACTION: Update Student & Create Submission ===
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create submission record
      const submission = queryRunner.manager.create(DailySubmission, {
        studentId,
        mosqueId: student.mosqueId,
        submissionDate: today,
        submissionData: dto.submissionData,
        xpEarned,
        streak: newStreak,
        campaignId,
      });
      await queryRunner.manager.save(submission);

      // Fetch fresh student data within transaction
      const freshStudent = await queryRunner.manager.findOne(Student, {
        where: { id: studentId },
        lock: { mode: "pessimistic_write" }, // Prevent concurrent updates
      });

      if (!freshStudent) {
        throw new NotFoundException("Student not found");
      }

      // Update XP
      freshStudent.totalXp += xpEarned;

      // Calculate new level based on updated XP
      const oldLevel = freshStudent.currentLevel;
      const newLevel = this.calculateLevel(freshStudent.totalXp);
      const levelUp = newLevel > oldLevel;
      freshStudent.currentLevel = newLevel;

      // Update streak
      freshStudent.currentStreak = newStreak;

      // Update max streak if exceeded
      if (newStreak > freshStudent.maxStreak) {
        freshStudent.maxStreak = newStreak;
      }

      // Update last login
      freshStudent.lastLoginAt = new Date();

      // Save student
      await queryRunner.manager.save(freshStudent);

      await queryRunner.commitTransaction();

      return {
        success: true,
        earnedXp: xpEarned,
        newTotalXp: freshStudent.totalXp,
        levelUp,
        newLevel,
        currentStreak: newStreak,
        maxStreak: freshStudent.maxStreak,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Calculate XP from submission data and campaign formConfig.
   * Supports both:
   * - New format: { submitted_xp, questions: FormQuestion[] }
   * - Legacy format: { submitted_xp, questions: Record<string, QuestionScoringConfig> }
   */
  private calculateXPFromFormConfig(
    submissionData: Record<string, unknown>,
    formConfig: Record<string, unknown>,
  ): number {
    const submittedXp = (formConfig.submitted_xp as number) ?? 0;
    let totalXp = submittedXp;

    const questions = formConfig.questions;
    if (!questions || typeof questions !== "object") return totalXp;

    // New format: questions is FormQuestion[]
    if (Array.isArray(questions)) {
      for (const q of questions as FormQuestion[]) {
        const val = submissionData[q.id];
        if (val === undefined || val === null) continue;

        switch (q.type) {
          case "GRID":
            if (typeof val === "object" && q.columns) {
              const xpMap = Object.fromEntries(q.columns.map((c) => [c.value, c.xp]));
              for (const colVal of Object.values(val)) {
                totalXp += xpMap[colVal as string] ?? 0;
              }
            }
            break;
          case "BOOLEAN":
            totalXp += val === true ? (q.xpYes ?? 0) : (q.xpNo ?? 0);
            break;
          case "NUMBER": {
            const num = Math.min(Number(val) || 0, q.max ?? Infinity);
            totalXp += num * (q.multiplier ?? 0);
            break;
          }
          case "SELECT":
            if (q.options) {
              const opt = q.options.find((o) => o.value === val);
              totalXp += opt?.xp ?? 0;
            }
            break;
        }
      }
      return totalXp;
    }

    // Legacy format: questions is Record<string, QuestionScoringConfig>
    const legacy = questions as Record<string, { type: string; xpMap?: Record<string, number>; xpYes?: number; xpNo?: number; multiplier?: number; max?: number }>;
    for (const [key, qConfig] of Object.entries(legacy)) {
      const val = submissionData[key];
      if (val === undefined || val === null) continue;

      switch (qConfig.type) {
        case "GRID":
          if (typeof val === "object" && qConfig.xpMap) {
            for (const colVal of Object.values(val)) {
              totalXp += qConfig.xpMap[colVal as string] ?? 0;
            }
          }
          break;
        case "BOOLEAN":
          totalXp += val === true ? (qConfig.xpYes ?? 0) : (qConfig.xpNo ?? 0);
          break;
        case "NUMBER": {
          const num = Math.min(Number(val) || 0, qConfig.max ?? Infinity);
          totalXp += num * (qConfig.multiplier ?? 0);
          break;
        }
      }
    }

    return totalXp;
  }

  /**
   * Calculate the current level based on total XP
   * Formula: Math.floor(totalXp / 500) + 1
   * Examples:
   * - 0-499 XP = Level 1
   * - 500-999 XP = Level 2
   * - 1000-1499 XP = Level 3
   * - etc.
   */
  private calculateLevel(totalXp: number): number {
    return Math.floor(totalXp / this.XP_PER_LEVEL) + 1;
  }

  /**
   * Calculate the current streak
   * Checks if there was a submission yesterday. If yes, increment previous streak.
   * If no previous submission, start at 1.
   */
  private async calculateStreak(
    studentId: string,
    todayStr: string,
    campaignId: string,
  ): Promise<number> {
    // Treat the input string as a UTC date to avoid local timezone shifts
    const yesterdayDate = new Date(`${todayStr}T00:00:00Z`);
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0]!;

    const previousSubmission = await this.submissionRepo.findOne({
      where: {
        studentId,
        submissionDate: yesterdayStr,
        campaignId,
      },
    });

    return previousSubmission ? previousSubmission.streak + 1 : 1;
  }
}
