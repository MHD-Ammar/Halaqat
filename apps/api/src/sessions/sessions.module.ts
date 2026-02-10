/**
 * Sessions Module
 *
 * Module for managing daily sessions and attendance.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Attendance } from "./entities/attendance.entity";
import { Session } from "./entities/session.entity";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";
import { CirclesModule } from "../circles/circles.module";
import { PointsModule } from "../points/points.module";
import { StudentsModule } from "../students/students.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Attendance]),
    StudentsModule, // For fetching students when auto-populating attendance
    CirclesModule, // For validating circle exists before creating session
    PointsModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
