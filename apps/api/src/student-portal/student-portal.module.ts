import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LeaderboardController } from "./leaderboard.controller";
import { StudentPortalLeaderboardService } from "./leaderboard.service";
import { DashboardService } from "./services/dashboard.service";
import { FeedService } from "./services/feed.service";
import { MilestoneUnlockService } from "./services/milestone-unlock.service";
import { QuestSubmissionService } from "./services/quest-submission.service";
import { StreakService } from "./services/streak.service";
import { XpAwardService } from "./services/xp-award.service";
import { StudentPortalController } from "./student-portal.controller";
import { StudentPortalFacade } from "./student-portal.facade";
import { Campaign } from "../daily-challenge/entities/campaign.entity";
import { DailySubmission } from "../daily-challenge/entities/daily-submission.entity";
import { AchievementService } from "../gamification/achievement.service";
import { Achievement } from "../gamification/entities/achievement.entity";
import { FeedReaction } from "../gamification/entities/feed-reaction.entity";
import { MilestoneReward } from "../gamification/entities/milestone-reward.entity";
import { StudentAchievement } from "../gamification/entities/student-achievement.entity";
import { StudentLeague } from "../gamification/entities/student-league.entity";
import { StudentMilestone } from "../gamification/entities/student-milestone.entity";
import { GamificationModule } from "../gamification/gamification.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { Recitation } from "../progress/entities/recitation.entity";
import { QuestCompletion } from "../quests/entities/quest-completion.entity";
import { Quest } from "../quests/entities/quest.entity";
import { Student } from "../students/entities/student.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      DailySubmission,
      Recitation,
      Campaign,
      Quest,
      QuestCompletion,
      MilestoneReward,
      StudentMilestone,
      Achievement,
      StudentAchievement,
      FeedReaction,
      StudentLeague,
    ]),
    GamificationModule,
    NotificationsModule,
  ],
  controllers: [StudentPortalController, LeaderboardController],
  providers: [
    StudentPortalFacade,
    QuestSubmissionService,
    XpAwardService,
    StreakService,
    MilestoneUnlockService,
    FeedService,
    DashboardService,
    AchievementService,
    StudentPortalLeaderboardService,
  ],
  exports: [StudentPortalFacade],
})
export class StudentPortalModule {}
