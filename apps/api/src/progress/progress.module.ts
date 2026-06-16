/**
 * Progress Module
 *
 * Module for tracking student progress (recitations).
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProgressController } from "./progress.controller";
import { ProgressService } from "./progress.service";
import { CurriculumModule } from "../curriculum/curriculum.module";
import { Recitation } from "./entities/recitation.entity";
import { MilestoneReward } from "../gamification/entities/milestone-reward.entity";
import { StudentMilestone } from "../gamification/entities/student-milestone.entity";
import { GamificationModule } from "../gamification/gamification.module";
import { RecitationMistake } from "../mushaf/entities/recitation-mistake.entity";
import { PointsModule } from "../points/points.module";
import { Student } from "../students/entities/student.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recitation,
      Student,
      MilestoneReward,
      StudentMilestone,
      // Owned by MushafModule, but registered here too so ProgressService can
      // persist mistakes atomically alongside the recitation rows it creates
      // during a Mushaf assessment. forFeature only builds repositories — it
      // does not re-declare ownership, so there's no conflict.
      RecitationMistake,
    ]),
    PointsModule, // For auto-awarding points
    CurriculumModule, // For page-to-surah lookup
    GamificationModule, // For achievement service if needed
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
