import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { calculateXPFromFormConfig } from "./calculators/form-xp.calculator";
import { SubmitStudentQuestDto } from "./dto/submit-student-quest.dto";
import { DashboardService } from "./services/dashboard.service";
import { FeedService } from "./services/feed.service";
import { MilestoneUnlockService } from "./services/milestone-unlock.service";
import { QuestSubmissionService } from "./services/quest-submission.service";
import { StreakService } from "./services/streak.service";
import { XpAwardService } from "./services/xp-award.service";
import { Campaign } from "../daily-challenge/entities/campaign.entity";
import { DailySubmission } from "../daily-challenge/entities/daily-submission.entity";
import { AchievementService } from "../gamification/achievement.service";
import { LastWeekLeagueResultResponse, LeagueService } from "../gamification/league.service";
import { Recitation } from "../progress/entities/recitation.entity";
import { Student } from "../students/entities/student.entity";

@Injectable()
export class StudentPortalFacade {
  private readonly logger = new Logger(StudentPortalFacade.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(DailySubmission)
    private readonly submissionRepo: Repository<DailySubmission>,
    @InjectRepository(Recitation)
    private readonly recitationRepo: Repository<Recitation>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    private readonly dataSource: DataSource,
    private readonly questSubmissions: QuestSubmissionService,
    private readonly xpAward: XpAwardService,
    private readonly streakService: StreakService,
    private readonly milestones: MilestoneUnlockService,
    private readonly feedService: FeedService,
    private readonly dashboardService: DashboardService,
    private readonly achievementService: AchievementService,
    private readonly leagueService: LeagueService,
  ) {}

  // ── Simple delegations ─────────────────────────────────────────────────────

  async getStudent(studentId: string): Promise<Student> {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException("Student not found");
    return student;
  }

  getQuests(studentId: string) {
    return this.questSubmissions.getQuests(studentId);
  }

  getTodayQuests(studentId: string) {
    return this.questSubmissions.getTodayQuests(studentId);
  }

  getDashboardData(studentId: string) {
    return this.dashboardService.getDashboardData(studentId);
  }

  getStudentMilestones(studentId: string) {
    return this.milestones.getStudentMilestones(studentId);
  }

  getAchievements(studentId: string) {
    return this.achievementService.getStudentAchievements(studentId);
  }

  claimMilestone(studentId: string, milestoneId: string) {
    return this.milestones.claimMilestone(studentId, milestoneId);
  }

  getLastWeekLeagueResult(
    studentId: string,
    mosqueId: string,
  ): Promise<LastWeekLeagueResultResponse | null> {
    return this.leagueService.getLastWeekResult(studentId, mosqueId);
  }

  markLastWeekLeagueResultSeen(studentId: string, mosqueId: string): Promise<{ success: true }> {
    return this.leagueService.markLastWeekResultSeen(studentId, mosqueId);
  }

  getLiveFeed(studentId: string) {
    return this.feedService.getLiveFeed(studentId);
  }

  toggleFeedReaction(studentId: string, feedItemKey: string) {
    return this.feedService.toggleFeedReaction(studentId, feedItemKey);
  }

  async markRecitationRewardSeen(studentId: string, recitationId: string) {
    const recitation = await this.recitationRepo.findOne({
      where: { id: recitationId, studentId },
    });
    if (!recitation) throw new NotFoundException("Recitation not found");
    recitation.rewardSeen = true;
    await this.recitationRepo.save(recitation);
    return { success: true };
  }

  // ── Transactional orchestration ────────────────────────────────────────────

  async completeQuest(studentId: string, questId: string) {
    return this.dataSource.transaction(async (manager) => {
      const { xpToAward } = await this.questSubmissions.validateAndPersistCompletion(
        manager,
        studentId,
        questId,
      );

      const award = await this.xpAward.awardXp(manager, studentId, xpToAward, { questId });

      const unlockedMilestones = award.transition.leveledUp
        ? await this.milestones.unlockForLevel(manager, studentId, award.transition.newLevel)
        : [];

      const newAchievements = await this.achievementService.evaluateAchievements(studentId, manager);

      // Fire-and-forget: league XP is a non-critical side-effect.
      // Intentionally outside the transaction so a league failure never rolls
      // back XP already credited to the student.  Failures are logged for
      // monitoring; an outbox/retry mechanism can be added if consistency
      // between student XP and league standings becomes a hard requirement.
      this.leagueService
        .addWeeklyXp(studentId, award.finalXp)
        .catch((err) =>
          this.logger.error(`Failed to add weekly league XP after completeQuest: ${String(err)}`),
        );

      return {
        success: true as const,
        earnedXp: award.finalXp,
        baseXp: award.breakdown.base,
        multiplier: award.streakMultiplier * award.eventMultiplier,
        newTotalXp: award.newTotalXp,
        levelUp: award.transition.leveledUp,
        newLevel: award.transition.newLevel,
        unlockedMilestones,
        newAchievements,
      };
    });
  }

  async logQuestProgress(studentId: string, questId: string, amount: number = 1) {
    return this.dataSource.transaction(async (manager) => {
      const { justCompleted, completion, xpToAward } =
        await this.questSubmissions.validateAndUpdateProgress(manager, studentId, questId, amount);

      if (!justCompleted || xpToAward === null) {
        return { currentProgress: completion.currentProgress, target: completion.currentProgress, justCompleted: false };
      }

      const award = await this.xpAward.awardXp(manager, studentId, xpToAward, { questId });

      // Persist earnedXp on the completion record
      completion.earnedXp = award.finalXp;
      await manager.save(completion);

      const unlockedMilestones = award.transition.leveledUp
        ? await this.milestones.unlockForLevel(manager, studentId, award.transition.newLevel)
        : [];

      const newAchievements = await this.achievementService.evaluateAchievements(studentId, manager);

      this.leagueService
        .addWeeklyXp(studentId, award.finalXp)
        .catch((err) =>
          this.logger.error(`Failed to add weekly league XP after logQuestProgress: ${String(err)}`), // fire-and-forget — see completeQuest for rationale
        );

      return {
        currentProgress: completion.currentProgress,
        target: completion.currentProgress,
        justCompleted: true,
        earnedXp: award.finalXp,
        baseXp: award.breakdown.base,
        multiplier: award.streakMultiplier * award.eventMultiplier,
        newTotalXp: award.newTotalXp,
        levelUp: award.transition.leveledUp,
        newLevel: award.transition.newLevel,
        unlockedMilestones,
        newAchievements,
      };
    });
  }

  async claimLoginBonus(studentId: string) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException("Student not found");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (student.lastLoginBonusAt && student.lastLoginBonusAt >= todayStart) {
      return { claimed: false };
    }

    return this.dataSource.transaction(async (manager) => {
      const award = await this.xpAward.awardXp(manager, studentId, 20);

      const freshStudent = await manager.findOne(Student, { where: { id: studentId } });
      if (freshStudent) {
        freshStudent.lastLoginBonusAt = new Date();
        await manager.save(freshStudent);
      }

      this.leagueService
        .addWeeklyXp(studentId, award.finalXp)
        .catch((err) =>
          this.logger.error(`Failed to add weekly league XP after claimLoginBonus: ${String(err)}`),
        );

      return {
        claimed: true,
        xpAwarded: award.finalXp,
        newTotalXp: award.newTotalXp,
        levelUp: award.transition.leveledUp,
        newLevel: award.transition.newLevel,
      };
    });
  }

  async submitQuest(studentId: string, dto: SubmitStudentQuestDto) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException("Student not found");

    const campaign = dto.campaignId
      ? await this.campaignRepo.findOne({ where: { id: dto.campaignId } })
      : await this.campaignRepo.findOne({ where: { isActive: true }, order: { createdAt: "DESC" } });

    if (!campaign) {
      throw new BadRequestException(dto.campaignId ? "Campaign not found" : "No active campaign found");
    }

    const formConfig = campaign.formConfig;
    if (!formConfig || typeof formConfig !== "object") {
      throw new BadRequestException("Invalid campaign config");
    }

    const today = dto.localDate ?? new Date().toISOString().split("T")[0]!;

    const existingSubmission = await this.submissionRepo.findOne({
      where: { studentId, submissionDate: today, campaignId: campaign.id },
    });
    if (existingSubmission) throw new BadRequestException("You have already submitted for today!");

    const baseXp = calculateXPFromFormConfig(dto.submissionData, formConfig);

    return this.dataSource.transaction(async (manager) => {
      // Award XP first (uses current streak for multiplier)
      const award = await this.xpAward.awardXp(manager, studentId, baseXp);

      // Record streak activity (updates streak after XP is calculated)
      const streakResult = await this.streakService.recordActivity(
        manager,
        studentId,
        today,
        campaign.id,
      );

      // Fetch updated student for shield/streak counts
      const freshStudent = await manager.findOne(Student, { where: { id: studentId } });

      // Create submission record
      const submission = manager.create(DailySubmission, {
        studentId,
        mosqueId: student.mosqueId,
        submissionDate: today,
        submissionData: dto.submissionData,
        xpEarned: baseXp,
        streak: streakResult.newStreak,
        campaignId: campaign.id,
      });
      await manager.save(submission);

      // Unlock milestones if leveled up
      const unlockedMilestones = award.transition.leveledUp
        ? await this.milestones.unlockForLevel(manager, studentId, award.transition.newLevel)
        : [];

      this.leagueService
        .addWeeklyXp(studentId, award.finalXp)
        .catch((err) =>
          this.logger.error(`Failed to add weekly league XP after submitQuest: ${String(err)}`),
        );

      return {
        success: true as const,
        earnedXp: award.finalXp,
        newTotalXp: award.newTotalXp,
        levelUp: award.transition.leveledUp,
        newLevel: award.transition.newLevel,
        currentStreak: streakResult.newStreak,
        maxStreak: freshStudent?.maxStreak ?? 0,
        unlockedMilestones,
        shieldUsed: streakResult.shieldUsed,
        shieldEarned: streakResult.shieldEarned,
        streakShields: freshStudent?.streakShields ?? 0,
      };
    });
  }

}
