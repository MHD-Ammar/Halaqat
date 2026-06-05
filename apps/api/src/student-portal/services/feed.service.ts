import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { FeedReaction } from "../../gamification/entities/feed-reaction.entity";
import { RewardType } from "../../gamification/entities/milestone-reward.entity";
import { StudentAchievement } from "../../gamification/entities/student-achievement.entity";
import { StudentLeague } from "../../gamification/entities/student-league.entity";
import { StudentMilestone } from "../../gamification/entities/student-milestone.entity";
import { QuestCompletion } from "../../quests/entities/quest-completion.entity";
import { Student } from "../../students/entities/student.entity";

interface FeedItem {
  id: string;
  type: string;
  date: Date;
  emoji: string;
  studentName: string;
  studentTitle: string | null;
  itemName: string;
  reactionCount?: number;
  hasReacted?: boolean;
}

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(QuestCompletion)
    private readonly questCompletionRepo: Repository<QuestCompletion>,
    @InjectRepository(StudentAchievement)
    private readonly studentAchievementRepo: Repository<StudentAchievement>,
    @InjectRepository(StudentMilestone)
    private readonly studentMilestoneRepo: Repository<StudentMilestone>,
    @InjectRepository(StudentLeague)
    private readonly studentLeagueRepo: Repository<StudentLeague>,
    @InjectRepository(FeedReaction)
    private readonly feedReactionRepo: Repository<FeedReaction>,
  ) {}

  async getLiveFeed(studentId: string) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException("Student not found");

    const mosqueId = student.mosqueId;

    const [recentQuests, recentAchievements, recentMilestones, recentLeagues, recentStudents] =
      await Promise.all([
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
        this.studentLeagueRepo.find({
          where: { mosqueId, result: "promoted" },
          relations: ["student", "tier"],
          order: { createdAt: "DESC" },
          take: 5,
        }),
        this.studentRepo.find({
          where: { mosqueId },
          order: { updatedAt: "DESC" },
          take: 10,
        }),
      ]);

    const feedItems: FeedItem[] = [
      ...recentQuests.map((q) => ({
        id: `q-${q.id}`,
        type: "QUEST",
        date: q.completedAt || new Date(),
        emoji: q.quest?.icon || "🏆",
        studentName: q.student?.name || "طالب",
        studentTitle: q.student?.activeTitle || null,
        itemName: q.quest?.title || "مهمة",
      })),
      ...recentAchievements.map((a) => ({
        id: `a-${a.id}`,
        type: "ACHIEVEMENT",
        date: a.unlockedAt || new Date(),
        emoji: a.achievement?.badgeIcon || "🔥",
        studentName: a.student?.name || "طالب",
        studentTitle: a.student?.activeTitle || null,
        itemName: a.achievement?.title || "وسام",
      })),
      ...recentMilestones
        .filter((m) => m.milestone)
        .map((m) => ({
          id: `m-${m.id}`,
          type: "MILESTONE",
          date: m.unlockedAt || m.createdAt || new Date(),
          emoji: m.milestone?.rewardType === RewardType.AVATAR_FRAME ? "🖼️" : "🎁",
          studentName: m.student?.name || "طالب",
          studentTitle: m.student?.activeTitle || null,
          itemName: m.milestone?.title || "مكافأة",
        })),
      ...recentLeagues.map((l) => ({
        id: `l-${l.id}`,
        type: "LEAGUE_PROMOTION",
        date: l.createdAt || new Date(),
        emoji: l.tier?.icon || "📈",
        studentName: l.student?.name || "طالب",
        studentTitle: l.student?.activeTitle || null,
        itemName: l.tier?.nameAr || "دوري",
      })),
    ];

    for (const s of recentStudents) {
      if (s.currentLevel > 1) {
        feedItems.push({
          id: `lvl-${s.id}-${s.currentLevel}`,
          type: "LEVEL_UP",
          date: s.updatedAt,
          emoji: "🎉",
          studentName: s.name,
          studentTitle: s.activeTitle,
          itemName: s.currentLevel.toString(),
        });
      }
      if (s.currentStreak >= 7 && (s.currentStreak % 7 === 0 || s.currentStreak === 30)) {
        feedItems.push({
          id: `strk-${s.id}-${s.currentStreak}`,
          type: "STREAK_MILESTONE",
          date: s.updatedAt,
          emoji: "🔥",
          studentName: s.name,
          studentTitle: s.activeTitle,
          itemName: s.currentStreak.toString(),
        });
      }
    }

    const finalFeed = feedItems.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
    const feedItemKeys = finalFeed.map((f) => f.id);
    const safeKeys = feedItemKeys.length > 0 ? feedItemKeys : ["none"];

    const [reactionCounts, myReactions] = await Promise.all([
      this.feedReactionRepo
        .createQueryBuilder("r")
        .select("r.feed_item_key", "key")
        .addSelect("COUNT(*)::int", "count")
        .where("r.feed_item_key IN (:...keys)", { keys: safeKeys })
        .groupBy("r.feed_item_key")
        .getRawMany(),
      this.feedReactionRepo.find({
        where: { studentId, feedItemKey: In(safeKeys) },
      }),
    ]);

    return finalFeed.map((item) => ({
      ...item,
      reactionCount: reactionCounts.find((r) => r.key === item.id)?.count ?? 0,
      hasReacted: myReactions.some((r) => r.feedItemKey === item.id),
    }));
  }

  async toggleFeedReaction(studentId: string, feedItemKey: string) {
    const existing = await this.feedReactionRepo.findOne({
      where: { studentId, feedItemKey },
    });

    if (existing) {
      await this.feedReactionRepo.remove(existing);
      return { reacted: false };
    }

    const reaction = this.feedReactionRepo.create({ studentId, feedItemKey, reaction: "congrats" });
    await this.feedReactionRepo.save(reaction);
    return { reacted: true };
  }
}
