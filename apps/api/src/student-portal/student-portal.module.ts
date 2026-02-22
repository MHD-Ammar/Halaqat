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
import { Recitation } from "../progress/entities/recitation.entity";
import { Student } from "../students/entities/student.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Student, DailySubmission, Recitation, Campaign])],
  controllers: [StudentPortalController],
  providers: [StudentPortalService],
  exports: [StudentPortalService],
})
export class StudentPortalModule {}
