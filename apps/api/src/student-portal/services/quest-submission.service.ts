import { QuestCategory, QuestFrequency } from "@halaqat/types";
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, IsNull, Repository } from "typeorm";

import { Campaign } from "../../daily-challenge/entities/campaign.entity";
import { DailySubmission } from "../../daily-challenge/entities/daily-submission.entity";
import { QuestCompletion } from "../../quests/entities/quest-completion.entity";
import { Quest } from "../../quests/entities/quest.entity";
import { Student } from "../../students/entities/student.entity";

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
  target: number;
  targetUnit: string | null;
  currentProgress: number;
}

@Injectable()
export class QuestSubmissionService {
  constructor(
    @InjectRepository(Quest)
    private readonly questRepo: Repository<Quest>,
    @InjectRepository(QuestCompletion)
    private readonly questCompletionRepo: Repository<QuestCompletion>,
    @InjectRepository(DailySubmission)
    private readonly submissionRepo: Repository<DailySubmission>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  // ── Read queries ───────────────────────────────────────────────────────────

  async getQuests(studentId: string): Promise<Record<QuestCategory, QuestWithCompletion[]>> {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      select: ["id", "circleId"],
    });

    if (!student) return this.emptyGroupedQuests();

    const whereConditions: Array<Record<string, unknown>> = [{ isActive: true, circleId: IsNull() }];
    if (student.circleId) {
      whereConditions.push({ isActive: true, circleId: student.circleId });
    }

    const quests = await this.questRepo.find({
      where: whereConditions,
      order: { category: "ASC", title: "ASC" },
    });

    if (quests.length === 0) return this.emptyGroupedQuests();

    const { todayStart, todayEnd, weekStart, weekEnd } = this.getDateBounds();
    const questIds = quests.map((q) => q.id);
    const completions = await this.questCompletionRepo.find({
      where: { studentId, questId: In(questIds) },
    });

    const completionSet = new Set<string>();
    const progressMap = new Map<string, number>();

    for (const q of quests) {
      const qCompletions = completions.filter((c) => c.questId === q.id);
      if (this.isCompletedInWindow(q, qCompletions, todayStart, todayEnd, weekStart, weekEnd)) {
        completionSet.add(q.id);
      }
      progressMap.set(q.id, this.getProgressInWindow(q, qCompletions, todayStart, todayEnd, weekStart, weekEnd));
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
      target: q.target,
      targetUnit: q.targetUnit,
      currentProgress: progressMap.get(q.id) ?? 0,
    }));

    const grouped: Record<string, QuestWithCompletion[]> = {};
    for (const cat of Object.values(QuestCategory)) {
      grouped[cat] = withStatus.filter((q) => q.category === cat);
    }
    return grouped as Record<QuestCategory, QuestWithCompletion[]>;
  }

  async getTodayQuests(studentId: string) {
    const activeCampaign = await this.campaignRepo.findOne({
      where: { isActive: true },
      order: { createdAt: "DESC" },
    });

    if (!activeCampaign) {
      return { hasSubmittedToday: false, todayXpEarned: undefined, config: null };
    }

    // noUncheckedIndexedAccess: split()[0] can be undefined; assert it is a string
    // (ISO date strings always have a "T", so [0] is always defined here)
    const today = new Date().toISOString().split("T")[0] as string;
    const submission = await this.submissionRepo.findOne({
      where: { studentId, submissionDate: today, campaignId: activeCampaign.id },
    });

    return {
      hasSubmittedToday: !!submission,
      todayXpEarned: submission?.xpEarned ?? undefined,
      config: activeCampaign.formConfig,
      campaignId: activeCampaign.id,
    };
  }

  // ── Write operations (called within facade-managed transactions) ───────────

  async validateAndPersistCompletion(
    manager: EntityManager,
    studentId: string,
    questId: string,
  ): Promise<{ xpToAward: number }> {
    const quest = await manager.findOne(Quest, { where: { id: questId } });
    if (!quest) throw new NotFoundException("Quest not found");
    if (!quest.isActive) throw new BadRequestException("Quest is not active");
    if (quest.target > 1) throw new BadRequestException("Use log-progress for multi-step quests");

    const { todayStart, todayEnd, weekStart, weekEnd } = this.getDateBounds();
    const existingCompletions = await manager.find(QuestCompletion, { where: { studentId, questId } });

    if (this.isCompletedInWindow(quest, existingCompletions, todayStart, todayEnd, weekStart, weekEnd)) {
      throw new ConflictException("Quest already completed for this period");
    }

    const completion = manager.create(QuestCompletion, {
      studentId,
      questId,
      currentProgress: quest.target,
      completedAt: new Date(),
      earnedXp: 0, // updated after XP grant
    });
    await manager.save(completion);

    return { xpToAward: quest.xpReward };
  }

  async validateAndUpdateProgress(
    manager: EntityManager,
    studentId: string,
    questId: string,
    amount: number,
  ): Promise<{ justCompleted: boolean; completion: QuestCompletion; xpToAward: number | null }> {
    if (amount <= 0) throw new BadRequestException("Amount must be positive");

    const quest = await manager.findOne(Quest, { where: { id: questId } });
    if (!quest) throw new NotFoundException("Quest not found");
    if (!quest.isActive) throw new BadRequestException("Quest is not active");
    if (quest.target <= 1) throw new BadRequestException("Use complete endpoint for single-step quests");

    const { todayStart, todayEnd, weekStart, weekEnd } = this.getDateBounds();
    const existingCompletions = await manager.find(QuestCompletion, { where: { studentId, questId } });

    if (this.isCompletedInWindow(quest, existingCompletions, todayStart, todayEnd, weekStart, weekEnd)) {
      throw new ConflictException("Quest already completed for this period");
    }

    const inProgress = existingCompletions.find((c) => !c.completedAt);
    let completion: QuestCompletion;

    if (!inProgress) {
      completion = manager.create(QuestCompletion, {
        studentId,
        questId,
        currentProgress: 0,
        completedAt: null,
      });
    } else {
      completion = await manager.findOne(QuestCompletion, {
        where: { id: inProgress.id },
        lock: { mode: "pessimistic_write" },
      }) as QuestCompletion;
    }

    const newProgress = Math.min(completion.currentProgress + amount, quest.target);
    const justCompleted = newProgress >= quest.target;

    completion.currentProgress = newProgress;
    if (justCompleted) {
      completion.completedAt = new Date();
    }
    await manager.save(QuestCompletion, completion);

    return { justCompleted, completion, xpToAward: justCompleted ? quest.xpReward : null };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  getDateBounds() {
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

    return { todayStart, todayEnd, weekStart: weekStartDate, weekEnd: weekEndDate };
  }

  private isCompletedInWindow(
    quest: Quest,
    completions: QuestCompletion[],
    todayStart: Date,
    todayEnd: Date,
    weekStart: Date,
    weekEnd: Date,
  ): boolean {
    for (const c of completions) {
      if (!c.completedAt) continue;
      const at = new Date(c.completedAt);
      if (quest.frequency === QuestFrequency.DAILY && at >= todayStart && at <= todayEnd) return true;
      if (quest.frequency === QuestFrequency.WEEKLY && at >= weekStart && at <= weekEnd) return true;
      if (quest.frequency === QuestFrequency.ONETIME) return true;
    }
    return false;
  }

  private getProgressInWindow(
    quest: Quest,
    completions: QuestCompletion[],
    todayStart: Date,
    todayEnd: Date,
    weekStart: Date,
    weekEnd: Date,
  ): number {
    if (completions.length === 0) return 0;

    const windowCompletions = completions.filter((c) => {
      if (c.completedAt) {
        // Completed records: check the completion timestamp against the active window.
        const at = new Date(c.completedAt);
        if (quest.frequency === QuestFrequency.DAILY) return at >= todayStart && at <= todayEnd;
        if (quest.frequency === QuestFrequency.WEEKLY) return at >= weekStart && at <= weekEnd;
        if (quest.frequency === QuestFrequency.ONETIME) return true;
        return false;
      }

      // In-progress records (no completedAt): use the record's createdAt to
      // determine whether it belongs to the current window.  Without this
      // check, a DAILY quest started yesterday but never finished would bleed
      // its progress into today's window.
      const createdAt = (c as { createdAt?: Date }).createdAt;
      if (!createdAt) return true; // fallback: include if no timestamp available

      const created = new Date(createdAt);
      if (quest.frequency === QuestFrequency.DAILY) return created >= todayStart && created <= todayEnd;
      if (quest.frequency === QuestFrequency.WEEKLY) return created >= weekStart && created <= weekEnd;
      return true; // ONETIME — always in scope
    });

    if (windowCompletions.length === 0) return 0;
    return Math.max(...windowCompletions.map((c) => c.currentProgress));
  }

  private emptyGroupedQuests(): Record<QuestCategory, QuestWithCompletion[]> {
    const empty: Record<string, QuestWithCompletion[]> = {};
    for (const cat of Object.values(QuestCategory)) empty[cat] = [];
    return empty as Record<QuestCategory, QuestWithCompletion[]>;
  }
}
