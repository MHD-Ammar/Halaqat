/**
 * Analytics Module
 *
 * Provides analytics and reporting functionality for Admin/Supervisor dashboards.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AnalyticsService } from "./analytics.service";
import { AnalyticsController } from "./analytics.controller";
import { Student } from "../students/entities/student.entity";
import { Session } from "../sessions/entities/session.entity";
import { PointTransaction } from "../points/entities/point-transaction.entity";
import { Circle } from "../circles/entities/circle.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Session,
      PointTransaction,
      Circle,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
