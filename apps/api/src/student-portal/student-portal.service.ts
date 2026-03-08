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

import { FormQuestion, QuestCategory , QuestFrequency } from "@halaqat/types";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, In, IsNull, Repository, LessThanOrEqual, MoreThan } from "typeorm";

import { SubmitStudentQuestDto } from "./dto/submit-student-quest.dto";
import { calculateLevelFromXp, XP_LEVEL_CURVE } from "../common/constants/leveling-curve";
import { getNextMultiplierTier, getStreakMultiplier } from "../common/constants/streak-multiplier";
import { getTitleKeyForLevel } from "../common/constants/student-titles";
import { Campaign } from "../daily-challenge/entities/campaign.entity";
import { DailySubmission } from "../daily-challenge/entities/daily-submission.entity";
import { AchievementService } from "../gamification/achievement.service";
import { Achievement } from "../gamification/entities/achievement.entity";
import { MilestoneReward, RewardType } from "../gamification/entities/milestone-reward.entity";
import { StudentAchievement } from "../gamification/entities/student-achievement.entity";
import { StudentMilestone } from "../gamification/entities/student-milestone.entity";
import { LastWeekLeagueResultResponse, LeagueService } from "../gamification/league.service";
import { Recitation } from "../progress/entities/recitation.entity";
import { QuestCompletion } from "../quests/entities/quest-completion.entity";
import { Quest } from "../quests/entities/quest.entity";
import { Student } from "../students/entities/student.entity";

export interface QuestWithCompletion {
  id: string;
  title: string;
  description: string | null;
  category: QuestCategory;
  frequency: QuestFrequency;
  xpReward: number;
  icon: string;
  isCompleted: boolean;
  circleId: string | null;
}

@Injectable()
export class StudentPortalService {
  private readonly logger = new Logger(StudentPortalService.name);

  /**
   * XP thresholds for leveling.
   * Formula: totalXp / 500 + 1 (e.g., 0-499 XP = Level 1, 500-999 = Level 2, etc.)
   */
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(DailySubmission)
    private submissionRepo: Repository<DailySubmission>,
    @InjectRepository(Recitation)
    private recitationRepo: Repository<Recitation>,
    @InjectRepository(Campaign)
    private campaignRepo: Repository<Campaign>,
    @InjectRepository(Quest)
    private questRepo: Repository<Quest>,
    @InjectRepository(QuestCompletion)
    private questCompletionRepo: Repository<QuestCompletion>,
    @InjectRepository(StudentMilestone)
    private studentMilestoneRepo: Repository<StudentMilestone>,
    @InjectRepository(StudentAchievement)
    private studentAchievementRepo: Repository<StudentAchievement>,
    private readonly dataSource: DataSource,
    private readonly achievementService: AchievementService,
    private readonly leagueService: LeagueService,
  ) {}

  private async processMilestoneUnlocks(
    manager: EntityManager,
    studentId: string,
    newLevel: number,
  ): Promise<StudentMilestone[]> {
    const eligibleMilestones = await manager.find(MilestoneReward, {
      where: { targetLevel: LessThanOrEqual(newLevel) },
    });
    if (eligibleMilestones.length === 0) return [];

    const existing = await manager.find(StudentMilestone, {
      where: { studentId },
    });
    const existingIds = new Set(existing.map((sm: StudentMilestone) => sm.milestoneId));

    const missing = eligibleMilestones.filter((m: MilestoneReward) => !existingIds.has(m.id));
    if (missing.length === 0) return [];

    const newStudentMilestones = missing.map((m: MilestoneReward) =>
      manager.create(StudentMilestone, {
        studentId,
        milestoneId: m.id,
        isClaimed: false,
        unlockedAt: new Date(),
      }),
    );
    return manager.save(StudentMilestone, newStudentMilestones);
  }

  /**
   * Get student details
   */
  async getStudent(studentId: string): Promise<Student> {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException("Student not found");
    return student;
  }

  /**
   * Get all active quests grouped by category with completion status.
   * Returns both global quests (circleId IS NULL) and circle-scoped quests
   * matching the student's circleId.
   */
  async getQuests(studentId: string): Promise<Record<QuestCategory, QuestWithCompletion[]>> {
    // Fetch student to get their circleId
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      select: ["id", "circleId"],
    });

    if (!student) {
      return this.emptyGroupedQuests();
    }

    // Build where conditions: global quests + circle-specific quests
    const whereConditions: Array<Record<string, unknown>> = [
      { isActive: true, circleId: IsNull() }, // Global quests
    ];

    if (student.circleId) {
      whereConditions.push({ isActive: true, circleId: student.circleId });
    }

    const quests = await this.questRepo.find({
      where: whereConditions,
      order: { category: "ASC", title: "ASC" },
    });

    if (quests.length === 0) {
      return this.emptyGroupedQuests();
    }

    const { todayStart, todayEnd, weekStart, weekEnd } = this.getDateBounds();

    const questIds = quests.map((q) => q.id);
    const completions = await this.questCompletionRepo.find({
      where: {
        studentId,
        questId: In(questIds),
      },
    });

    // Filter completions by time window per quest
    const completionSet = new Set<string>();
    for (const q of quests) {
      const qCompletions = completions.filter((c) => c.questId === q.id);
      const isCompleted = this.isQuestCompletedInWindow(
        q,
        qCompletions,
        todayStart,
        todayEnd,
        weekStart,
        weekEnd,
      );
      if (isCompleted) {
        completionSet.add(q.id);
      }
    }

    const withStatus: QuestWithCompletion[] = quests.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      frequency: q.frequency,
      xpReward: q.xpReward,
      icon: q.icon,
      isCompleted: completionSet.has(q.id),
      circleId: q.circleId,
    }));

    const grouped: Record<string, QuestWithCompletion[]> = {};
    for (const cat of Object.values(QuestCategory)) {
      grouped[cat] = withStatus.filter((q) => q.category === cat);
    }
    return grouped as Record<QuestCategory, QuestWithCompletion[]>;
  }

  private emptyGroupedQuests(): Record<QuestCategory, QuestWithCompletion[]> {
    const empty: Record<string, QuestWithCompletion[]> = {};
    for (const cat of Object.values(QuestCategory)) {
      empty[cat] = [];
    }
    return empty as Record<QuestCategory, QuestWithCompletion[]>;
  }

  private getDateBounds(): {
    todayStart: Date;
    todayEnd: Date;
    weekStart: Date;
    weekEnd: Date;
  } {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]!;
    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999Z`);

    const dayOfWeek = now.getUTCDay();
    const weekStartDate = new Date(now);
    weekStartDate.setUTCDate(weekStartDate.getUTCDate() - dayOfWeek);
    weekStartDate.setUTCHours(0, 0, 0, 0);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
    weekEndDate.setUTCHours(23, 59, 59, 999);

    return {
      todayStart,
      todayEnd,
      weekStart: weekStartDate,
      weekEnd: weekEndDate,
    };
  }

  private isQuestCompletedInWindow(
    quest: Quest,
    completions: QuestCompletion[],
    todayStart: Date,
    todayEnd: Date,
    weekStart: Date,
    weekEnd: Date,
  ): boolean {
    if (completions.length === 0) return false;
    for (const c of completions) {
      const at = new Date(c.completedAt);
      switch (quest.frequency) {
        case QuestFrequency.DAILY:
          if (at >= todayStart && at <= todayEnd) return true;
          break;
        case QuestFrequency.WEEKLY:
          if (at >= weekStart && at <= weekEnd) return true;
          break;
        case QuestFrequency.ONETIME:
          return true;
      }
    }
    return false;
  }

  /**
   * Complete a quest for a student
   */
  async completeQuest(
    studentId: string,
    questId: string,
  ): Promise<{
    success: true;
    earnedXp: number;
    baseXp: number;
    multiplier: number;
    newTotalXp: number;
    levelUp: boolean;
    newLevel: number;
    unlockedMilestones: StudentMilestone[];
    newAchievements: Achievement[];
  }> {
    const quest = await this.questRepo.findOne({ where: { id: questId } });
    if (!quest) {
      throw new NotFoundException("Quest not found");
    }
    if (!quest.isActive) {
      throw new BadRequestException("Quest is not active");
    }

    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException("Student not found");
    }

    const { todayStart, todayEnd, weekStart, weekEnd } = this.getDateBounds();

    const existingCompletions = await this.questCompletionRepo.find({
      where: { studentId, questId },
    });

    const alreadyCompleted = this.isQuestCompletedInWindow(
      quest,
      existingCompletions,
      todayStart,
      todayEnd,
      weekStart,
      weekEnd,
    );
    if (alreadyCompleted) {
      throw new ConflictException("Quest already completed for this period");
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const completion = queryRunner.manager.create(QuestCompletion, {
        studentId,
        questId,
        earnedXp: quest.xpReward,
      });
      await queryRunner.manager.save(completion);

      const freshStudent = await queryRunner.manager.findOne(Student, {
        where: { id: studentId },
        lock: { mode: "pessimistic_write" },
      });
      if (!freshStudent) {
        throw new NotFoundException("Student not found");
      }

      const { multiplier } = getStreakMultiplier(freshStudent.currentStreak);
      const baseXp = quest.xpReward;
      const earnedXp = Math.round(baseXp * multiplier);

      const oldLevel = freshStudent.currentLevel;
      freshStudent.totalXp += earnedXp;
      freshStudent.currentLevel = this.calculateLevel(freshStudent.totalXp);
      const levelUp = freshStudent.currentLevel > oldLevel;

      let unlockedMilestones: StudentMilestone[] = [];
      if (levelUp) {
        unlockedMilestones = await this.processMilestoneUnlocks(
          queryRunner.manager,
          studentId,
          freshStudent.currentLevel,
        );
        const newTitle = getTitleKeyForLevel(freshStudent.currentLevel);
        // Auto-assign the level-based title (students can also have milestone titles)
        freshStudent.activeTitle = newTitle;
      }

      // Evaluate achievements dynamically
      const newAchievements = await this.achievementService.evaluateAchievements(studentId, queryRunner.manager);

      await queryRunner.manager.save(freshStudent);
      await queryRunner.commitTransaction();
      try {
        await this.leagueService.addWeeklyXp(studentId, earnedXp);
      } catch (error) {
        this.logger.error(`Failed to add weekly league XP after completeQuest: ${String(error)}`);
      }

      return {
        success: true,
        earnedXp,
        baseXp,
        multiplier,
        newTotalXp: freshStudent.totalXp,
        levelUp,
        newLevel: freshStudent.currentLevel,
        unlockedMilestones,
        newAchievements,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

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

    const { multiplier } = getStreakMultiplier(student.currentStreak);
    const baseXp = 20;
    const xpAwarded = Math.round(baseXp * multiplier);

    student.totalXp += xpAwarded;

    const oldLevel = student.currentLevel;
    const newLevel = this.calculateLevel(student.totalXp);
    const levelUp = newLevel > oldLevel;
    student.currentLevel = newLevel;

    student.lastLoginBonusAt = new Date();

    await this.studentRepo.save(student);
    try {
      await this.leagueService.addWeeklyXp(studentId, xpAwarded);
    } catch (error) {
      this.logger.error(`Failed to add weekly league XP after claimLoginBonus: ${String(error)}`);
    }

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
      select: ["id", "totalXp", "currentLevel", "currentStreak", "streakShields", "lastShieldUsedAt", "activeTitle", "activeAvatarFrame"],
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    const today = new Date();
    const last30Days: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last30Days.push(d.toISOString().split("T")[0]!);
    }

    const query = this.submissionRepo
      .createQueryBuilder("sub")
      .where("sub.student_id = :studentId", { studentId })
      .andWhere("sub.submission_date IN (:...dates)", { dates: last30Days });

    const activeCampaign = await this.campaignRepo.findOne({
      where: { isActive: true },
      order: { createdAt: "DESC" },
    });

    if (activeCampaign) {
      query.andWhere("sub.campaign_id = :campaignId", { campaignId: activeCampaign.id });
    } else {
      query.andWhere("1 = 0"); // No active campaign = no submissions
    }

    const recentSubmissions = await query.getMany();

    const streakCalendar: Record<string, boolean> = {};
    for (const date of last30Days) {
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

    // Find the first unseen recitation reward with XP
    const unseenRewardRecitation = await this.recitationRepo.findOne({
      where: { 
        studentId, 
        rewardSeen: false,
        xpAwarded: MoreThan(0),
      },
      relations: ["surah"],
      order: { createdAt: "ASC" },
    });

    const hasUnseenRecitationReward = !!unseenRewardRecitation;
    const unseenRecitationReward = unseenRewardRecitation 
      ? {
          id: unseenRewardRecitation.id,
          quality: unseenRewardRecitation.quality,
          xpAwarded: unseenRewardRecitation.xpAwarded,
          surahName: unseenRewardRecitation.surah?.nameArabic || "سورة غير معروفة",
        }
      : null;

    const todayStr = today.toISOString().split("T")[0]!;
    const hasSubmittedToday = streakCalendar[todayStr] ?? false;

    const currentLevelThreshold = XP_LEVEL_CURVE[student.currentLevel - 1] ?? 0;
    const isMaxLevel = student.currentLevel >= XP_LEVEL_CURVE.length;
    
    let nextLevelXp = 0;
    const currentLevelXp = currentLevelThreshold;
    let xpProgress = 100;
    let xpToNextLevel = 0;

    if (isMaxLevel) {
      nextLevelXp = student.totalXp;
      xpProgress = 100;
      xpToNextLevel = 0;
    } else {
      nextLevelXp = XP_LEVEL_CURVE[student.currentLevel] ?? (currentLevelThreshold + 500);
      const xpIntoLevel = Math.max(0, student.totalXp - currentLevelThreshold);
      const xpNeededForLevel = nextLevelXp - currentLevelThreshold;
      xpProgress = xpNeededForLevel > 0 ? Math.min(Math.round((xpIntoLevel / xpNeededForLevel) * 100), 100) : 100;
      xpToNextLevel = Math.max(0, nextLevelXp - student.totalXp);
    }

    const streakMultiplier = getStreakMultiplier(student.currentStreak);
    const nextTier = getNextMultiplierTier(student.currentStreak);

    return {
      streakCalendar,
      recentRecitations: formattedRecitations,
      hasSubmittedToday,
      currentStreak: student.currentStreak,
      totalXp: student.totalXp,
      currentLevel: student.currentLevel,
      hasUnseenRecitationReward,
      unseenRecitationReward,
      nextLevelXp,
      currentLevelXp,
      xpProgress,
      xpToNextLevel,
      streakMultiplier: streakMultiplier.multiplier,
      streakMultiplierLabel: streakMultiplier.labelAr,
      streakMultiplierTier: streakMultiplier.tier,
      nextMultiplierDaysNeeded: nextTier?.daysNeeded ?? null,
      nextMultiplierLabel: nextTier?.nextMultiplier ?? null,
      streakShields: student.streakShields,
      maxStreakShields: 3,
      lastShieldUsedAt: student.lastShieldUsedAt,
      activeTitle: student.activeTitle,
      activeAvatarFrame: student.activeAvatarFrame,
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
    const { newStreak, shieldUsed } = await this.calculateStreak(
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

      const { multiplier } = getStreakMultiplier(freshStudent.currentStreak);
      const baseXp = xpEarned;
      const adjustedXp = Math.round(baseXp * multiplier);

      // Update XP
      freshStudent.totalXp += adjustedXp;

      // Calculate new level based on updated XP
      const oldLevel = freshStudent.currentLevel;
      const newLevel = this.calculateLevel(freshStudent.totalXp);
      const levelUp = newLevel > oldLevel;
      freshStudent.currentLevel = newLevel;

      // Unlock milestones if leveled up
      let unlockedMilestones: StudentMilestone[] = [];
      if (levelUp) {
        unlockedMilestones = await this.processMilestoneUnlocks(
          queryRunner.manager,
          studentId,
          freshStudent.currentLevel,
        );
        const newTitle = getTitleKeyForLevel(freshStudent.currentLevel);
        // Auto-assign the level-based title (students can also have milestone titles)
        freshStudent.activeTitle = newTitle;
      }

      // Update streak
      freshStudent.currentStreak = newStreak;

      // Update max streak if exceeded
      if (newStreak > freshStudent.maxStreak) {
        freshStudent.maxStreak = newStreak;
      }

      // Check shield reward
      const shieldEarned = this.checkShieldReward(freshStudent, newStreak);

      // Update last login
      freshStudent.lastLoginAt = new Date();

      // Save student
      await queryRunner.manager.save(freshStudent);

      await queryRunner.commitTransaction();
      try {
        await this.leagueService.addWeeklyXp(studentId, adjustedXp);
      } catch (error) {
        this.logger.error(`Failed to add weekly league XP after submitQuest: ${String(error)}`);
      }

      return {
        success: true,
        earnedXp: adjustedXp,
        newTotalXp: freshStudent.totalXp,
        levelUp,
        newLevel,
        currentStreak: newStreak,
        maxStreak: freshStudent.maxStreak,
        unlockedMilestones,
        shieldUsed,
        shieldEarned,
        streakShields: freshStudent.streakShields,
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
   * Mark a recitation reward as seen (so the popup doesn't show again)
   */
  async markRecitationRewardSeen(studentId: string, recitationId: string) {
    const recitation = await this.recitationRepo.findOne({
      where: { id: recitationId, studentId },
    });

    if (!recitation) {
      throw new NotFoundException("Recitation not found");
    }

    recitation.rewardSeen = true;
    await this.recitationRepo.save(recitation);

    return { success: true };
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
    return calculateLevelFromXp(totalXp);
  }

  /**
   * Get all milestones for a student
   */
  async getStudentMilestones(studentId: string) {
    const milestones = await this.studentMilestoneRepo.find({
      where: { studentId },
      relations: ["milestone"],
      order: { milestone: { targetLevel: "ASC" } },
    });
    // Filter out orphaned records where the milestone definition is missing
    return milestones.filter((sm) => sm.milestone);
  }

  /**
   * Get all achievements and unlock status for a student
   */
  async getAchievements(studentId: string) {
    return this.achievementService.getStudentAchievements(studentId);
  }

  /**
   * Claim a milestone reward (The Loot Box Claiming Logic).
   */
  async claimMilestone(studentId: string, milestoneId: string) {
    const studentMilestone = await this.studentMilestoneRepo.findOne({
      where: { id: milestoneId, studentId },
      relations: ["milestone"],
    });

    if (!studentMilestone) {
      throw new NotFoundException("Milestone not found or not unlocked yet");
    }

    if (studentMilestone.isClaimed) {
      throw new BadRequestException("Milestone already claimed");
    }

    studentMilestone.isClaimed = true;

    let rewardGiven = false;
    let newTotalXp: number | undefined;

    if (!studentMilestone.milestone) {
      throw new InternalServerErrorException(
        `Milestone definition not found for student milestone ${milestoneId}. This usually happens if the milestone_rewards table was wiped but student records remain.`,
      );
    }

    if (studentMilestone.milestone.rewardType === RewardType.BONUS_XP) {
      const bonusXp = parseInt(studentMilestone.milestone.rewardValue, 10);
      if (!isNaN(bonusXp)) {
        const student = await this.studentRepo.findOne({ where: { id: studentId } });
        if (student) {
          student.totalXp += bonusXp;
          student.currentLevel = this.calculateLevel(student.totalXp);
          await this.studentRepo.save(student);
          newTotalXp = student.totalXp;
          rewardGiven = true;
        }
      }
    } else if (studentMilestone.milestone.rewardType === RewardType.TITLE) {
      const student = await this.studentRepo.findOne({ where: { id: studentId } });
      if (student) {
        student.activeTitle = studentMilestone.milestone.rewardValue;
        await this.studentRepo.save(student);
        rewardGiven = true;
      }
    } else if (studentMilestone.milestone.rewardType === RewardType.AVATAR_FRAME) {
      const student = await this.studentRepo.findOne({ where: { id: studentId } });
      if (student) {
        student.activeAvatarFrame = studentMilestone.milestone.rewardValue;
        await this.studentRepo.save(student);
        rewardGiven = true;
      }
    } else {
      // Unknown reward type — log a warning but don't crash
      this.logger.warn(`Unknown reward type: ${studentMilestone.milestone.rewardType} for milestone ${milestoneId}`);
      rewardGiven = false;
    }

    await this.studentMilestoneRepo.save(studentMilestone);

    return {
      success: true,
      rewardDetails: {
        type: studentMilestone.milestone.rewardType,
        value: studentMilestone.milestone.rewardValue,
        applied: rewardGiven,
      },
      newTotalXp,
    };
  }

  /**
   * Check if a student earned a new streak shield
   */
  private checkShieldReward(student: Student, newStreak: number): boolean {
    const SHIELD_REWARD_STREAKS = [7, 14, 21, 30]; // Earn a shield at these streak milestones
    const MAX_SHIELDS = 3;
    
    if (SHIELD_REWARD_STREAKS.includes(newStreak) && student.streakShields < MAX_SHIELDS) {
      student.streakShields += 1;
      return true; // Shield earned
    }
    return false;
  }

  /**
   * Calculate the current streak
   * Checks if there was a submission yesterday. If yes, increment previous streak.
   * If no submission but student has shields > 0 and streak > 0, auto-consume a shield.
   * If no previous submission and no shields, start at 1.
   */
  private async calculateStreak(
    studentId: string,
    todayStr: string,
    campaignId: string,
  ): Promise<{ newStreak: number; shieldUsed: boolean }> {
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

    if (previousSubmission) {
      return { newStreak: previousSubmission.streak + 1, shieldUsed: false };
    }

    // No submission yesterday — check for shield
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (student && student.streakShields > 0 && student.currentStreak > 0) {
      // Consume a shield to protect the streak
      student.streakShields -= 1;
      student.lastShieldUsedAt = new Date();
      await this.studentRepo.save(student);
      return { newStreak: student.currentStreak + 1, shieldUsed: true };
    }

    return { newStreak: 1, shieldUsed: false };
  }

  async getLastWeekLeagueResult(
    studentId: string,
    mosqueId: string,
  ): Promise<LastWeekLeagueResultResponse | null> {
    return this.leagueService.getLastWeekResult(studentId, mosqueId);
  }

  async markLastWeekLeagueResultSeen(
    studentId: string,
    mosqueId: string,
  ): Promise<{ success: true }> {
    return this.leagueService.markLastWeekResultSeen(studentId, mosqueId);
  }

  /**
   * Get Live Social Feed
   * Returns recent events (Quests, Achievements, Milestones) for the student's mosque
   */
  async getLiveFeed(studentId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    const mosqueId = student.mosqueId;

    const [recentQuests, recentAchievements, recentMilestones] = await Promise.all([
      this.questCompletionRepo.find({
        where: { student: { mosqueId } },
        relations: ["student", "quest"],
        order: { completedAt: "DESC" },
        take: 5,
      }),
      this.studentAchievementRepo.find({
        where: { student: { mosqueId } },
        relations: ["student", "achievement"],
        order: { unlockedAt: "DESC" },
        take: 5,
      }),
      this.studentMilestoneRepo.find({
        where: { student: { mosqueId } },
        relations: ["student", "milestone"],
        order: { unlockedAt: "DESC" },
        take: 5,
      }),
    ]);

    const feedItems = [
      ...recentQuests.map((q) => ({
        id: `q-${q.id}`,
        type: "QUEST" as const,
        date: q.completedAt || new Date(),
        emoji: "🏆",
        studentName: q.student?.name || "طالب",
        studentTitle: q.student?.activeTitle || null,
        itemName: q.quest?.title || "مهمة",
      })),
      ...recentAchievements.map((a) => ({
        id: `a-${a.id}`,
        type: "ACHIEVEMENT" as const,
        date: a.unlockedAt || new Date(),
        emoji: "🔥",
        studentName: a.student?.name || "طالب",
        studentTitle: a.student?.activeTitle || null,
        itemName: a.achievement?.title || "وسام",
      })),
      ...recentMilestones
        .filter((m) => m.milestone) // Defensive guard
        .map((m) => ({
          id: `m-${m.id}`,
          type: "MILESTONE" as const,
          date: m.unlockedAt || m.createdAt || new Date(),
          emoji: "🎁",
          studentName: m.student?.name || "طالب",
          studentTitle: m.student?.activeTitle || null,
          itemName: m.milestone?.title || "مكافأة",
        })),
    ];

    feedItems.sort((a, b) => b.date.getTime() - a.date.getTime());
    return feedItems.slice(0, 5).map(({ id, emoji, type, studentName, studentTitle, itemName }) => ({ 
      id, emoji, type, studentName, studentTitle, itemName 
    }));
  }
}
