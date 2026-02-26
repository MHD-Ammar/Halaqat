/**
 * Student Portal Module
 *
 * Feature module for the student-facing portal.
 * Includes gamification logic for daily quests, XP, leveling, and streaks.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { StudentPortalController } from "./student-portal.controller";
import { StudentPortalService } from "./student-portal.service";
import { Campaign } from "../daily-challenge/entities/campaign.entity";
import { DailySubmission } from "../daily-challenge/entities/daily-submission.entity";
import { AchievementService } from "../gamification/achievement.service";
import { Achievement } from "../gamification/entities/achievement.entity";
import { MilestoneReward } from "../gamification/entities/milestone-reward.entity";
import { StudentAchievement } from "../gamification/entities/student-achievement.entity";
import { StudentMilestone } from "../gamification/entities/student-milestone.entity";
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
    ]),
  ],
  controllers: [StudentPortalController],
  providers: [StudentPortalService, AchievementService],
  exports: [StudentPortalService],
})
export class StudentPortalModule {}
