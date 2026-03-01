import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AchievementService } from "./achievement.service";
import { AdminGamificationController } from "./admin-gamification.controller";
import { AdminGamificationService } from "./admin-gamification.service";
import { Achievement } from "./entities/achievement.entity";
import { MilestoneReward } from "./entities/milestone-reward.entity";
import { StudentAchievement } from "./entities/student-achievement.entity";
import { StudentMilestone } from "./entities/student-milestone.entity";
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
      Student,
      QuestCompletion,
      Circle,
    ]),
  ],
  controllers: [AdminGamificationController, TeacherQuestsController],
  providers: [AdminGamificationService, AchievementService, TeacherQuestsService],
  exports: [AdminGamificationService, AchievementService],
})
export class GamificationModule {}

