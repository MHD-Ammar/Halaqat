import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AchievementService } from "./achievement.service";
import { AdminGamificationController } from "./admin-gamification.controller";
import { AdminGamificationService } from "./admin-gamification.service";
import { Achievement } from "./entities/achievement.entity";
import { EventQuest } from "./entities/event-quest.entity";
import { FeedReaction } from "./entities/feed-reaction.entity";
import { LeagueTier } from "./entities/league-tier.entity";
import { MilestoneReward } from "./entities/milestone-reward.entity";
import { SeasonalEvent } from "./entities/seasonal-event.entity";
import { StoreItem } from "./entities/store-item.entity";
import { StorePurchase } from "./entities/store-purchase.entity";
import { StudentAchievement } from "./entities/student-achievement.entity";
import { StudentLeague } from "./entities/student-league.entity";
import { StudentMilestone } from "./entities/student-milestone.entity";
import { LeagueScheduler } from "./league.scheduler";
import { LeagueService } from "./league.service";
import { SeasonalEventService } from "./seasonal-event.service";
import { StoreService } from "./store.service";
import { TeacherQuestsController } from "./teacher-quests.controller";
import { TeacherQuestsService } from "./teacher-quests.service";
import { Circle } from "../circles/entities/circle.entity";
import { QuestCompletion } from "../quests/entities/quest-completion.entity";
import { Quest } from "../quests/entities/quest.entity";
import { Student } from "../students/entities/student.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quest,
      MilestoneReward,
      Achievement,
      StudentAchievement,
      StudentMilestone,
      StoreItem,
      StorePurchase,
      Student,
      QuestCompletion,
      Circle,
      LeagueTier,
      StudentLeague,
      SeasonalEvent,
      EventQuest,
      FeedReaction,
    ]),
  ],
  controllers: [AdminGamificationController, TeacherQuestsController],
  providers: [
    AdminGamificationService,
    AchievementService,
    TeacherQuestsService,
    StoreService,
    LeagueService,
    LeagueScheduler,
    SeasonalEventService,
  ],
  exports: [
    AdminGamificationService,
    AchievementService,
    StoreService,
    LeagueService,
    SeasonalEventService,
    TypeOrmModule, // Export TypeOrmModule to make FeedReaction available
  ],
})
export class GamificationModule {}
