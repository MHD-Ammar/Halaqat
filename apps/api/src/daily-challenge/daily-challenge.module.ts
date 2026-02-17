import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DailyChallengeController } from "./daily-challenge.controller";
import { DailyChallengeService } from "./daily-challenge.service";
import { DailySubmission } from "./entities/daily-submission.entity";
import { Circle } from "../circles/entities/circle.entity";
import { Mosque } from "../mosques/entities/mosque.entity";
import { Student } from "../students/entities/student.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([DailySubmission, Student, Circle, Mosque]),
  ],
  controllers: [DailyChallengeController],
  providers: [DailyChallengeService],
})
export class DailyChallengeModule {}
