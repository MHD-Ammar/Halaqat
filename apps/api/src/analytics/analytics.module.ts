/**
 * Analytics Module
 *
 * Provides analytics and reporting functionality for Admin/Supervisor dashboards.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { Circle } from "../circles/entities/circle.entity";
import { PointTransaction } from "../points/entities/point-transaction.entity";
import { Recitation } from "../progress/entities/recitation.entity";
import { Session } from "../sessions/entities/session.entity";
import { Student } from "../students/entities/student.entity";
import { User } from "../users/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Session,
      PointTransaction,
      Circle,
      User,
      Recitation,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
