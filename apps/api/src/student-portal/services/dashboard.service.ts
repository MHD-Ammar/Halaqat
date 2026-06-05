import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, Repository } from "typeorm";

import { getNextMultiplierTier, getStreakMultiplier } from "../../common/constants/streak-multiplier";
import { Campaign } from "../../daily-challenge/entities/campaign.entity";
import { DailySubmission } from "../../daily-challenge/entities/daily-submission.entity";
import { SeasonalEventService } from "../../gamification/seasonal-event.service";
import { Recitation } from "../../progress/entities/recitation.entity";
import { Student } from "../../students/entities/student.entity";
import { XP_LEVEL_CURVE } from "../calculators/level.calculator";

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(DailySubmission)
    private readonly submissionRepo: Repository<DailySubmission>,
    @InjectRepository(Recitation)
    private readonly recitationRepo: Repository<Recitation>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    private readonly eventService: SeasonalEventService,
  ) {}

  async getDashboardData(studentId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      select: [
        "id",
        "totalXp",
        "currentLevel",
        "currentStreak",
        "streakShields",
        "lastShieldUsedAt",
        "activeTitle",
        "activeAvatarFrame",
        "mosqueId",
      ],
    });
    if (!student) throw new NotFoundException("Student not found");

    const today = new Date();
    const last30Days: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last30Days.push(d.toISOString().split("T")[0]!);
    }

    const activeCampaign = await this.campaignRepo.findOne({
      where: { isActive: true },
      order: { createdAt: "DESC" },
    });

    const query = this.submissionRepo
      .createQueryBuilder("sub")
      .where("sub.student_id = :studentId", { studentId })
      .andWhere("sub.submission_date IN (:...dates)", { dates: last30Days });

    if (activeCampaign) {
      query.andWhere("sub.campaign_id = :campaignId", { campaignId: activeCampaign.id });
    } else {
      query.andWhere("1 = 0");
    }

    const recentSubmissions = await query.getMany();

    const streakCalendar: Record<string, boolean> = {};
    for (const date of last30Days) streakCalendar[date] = false;
    for (const sub of recentSubmissions) streakCalendar[sub.submissionDate] = true;

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

    const unseenRewardRecitation = await this.recitationRepo.findOne({
      where: { studentId, rewardSeen: false, xpAwarded: MoreThan(0) },
      relations: ["surah"],
      order: { createdAt: "ASC" },
    });

    const todayStr = today.toISOString().split("T")[0]!;
    const currentLevelThreshold = XP_LEVEL_CURVE[student.currentLevel - 1] ?? 0;
    const isMaxLevel = student.currentLevel >= XP_LEVEL_CURVE.length;

    let nextLevelXp = 0;
    let xpProgress = 100;
    let xpToNextLevel = 0;

    if (!isMaxLevel) {
      nextLevelXp = XP_LEVEL_CURVE[student.currentLevel] ?? (currentLevelThreshold + 500);
      const xpIntoLevel = Math.max(0, student.totalXp - currentLevelThreshold);
      const xpNeededForLevel = nextLevelXp - currentLevelThreshold;
      xpProgress =
        xpNeededForLevel > 0
          ? Math.min(Math.round((xpIntoLevel / xpNeededForLevel) * 100), 100)
          : 100;
      xpToNextLevel = Math.max(0, nextLevelXp - student.totalXp);
    } else {
      nextLevelXp = student.totalXp;
    }

    const streakMultiplier = getStreakMultiplier(student.currentStreak);
    const nextTier = getNextMultiplierTier(student.currentStreak);
    const activeEvent = await this.eventService.getActiveEventWithCountdown(student.mosqueId);

    return {
      streakCalendar,
      recentRecitations: formattedRecitations,
      hasSubmittedToday: streakCalendar[todayStr] ?? false,
      currentStreak: student.currentStreak,
      totalXp: student.totalXp,
      currentLevel: student.currentLevel,
      hasUnseenRecitationReward: !!unseenRewardRecitation,
      unseenRecitationReward: unseenRewardRecitation
        ? {
            id: unseenRewardRecitation.id,
            quality: unseenRewardRecitation.quality,
            xpAwarded: unseenRewardRecitation.xpAwarded,
            surahName: unseenRewardRecitation.surah?.nameArabic || "سورة غير معروفة",
          }
        : null,
      nextLevelXp,
      currentLevelXp: currentLevelThreshold,
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
      activeEvent: activeEvent
        ? {
            id: activeEvent.id,
            nameAr: activeEvent.nameAr,
            descriptionAr: activeEvent.descriptionAr,
            icon: activeEvent.icon,
            themeColor: activeEvent.themeColor,
            xpMultiplier: activeEvent.xpMultiplier,
            remainingHours: activeEvent.remainingHours,
            remainingDays: activeEvent.remainingDays,
            endsAt: activeEvent.endsAt.toISOString(),
          }
        : null,
    };
  }
}
