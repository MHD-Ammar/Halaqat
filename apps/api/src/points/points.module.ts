/**
 * Points Module
 *
 * Module for managing point rules, transactions, and gamification.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PointRule } from "./entities/point-rule.entity";
import { PointTransaction } from "./entities/point-transaction.entity";
import { PointsSeederService } from "./points-seeder.service";
import { PointsController } from "./points.controller";
import { PointsService } from "./points.service";
import { Mosque } from "../mosques/entities/mosque.entity";
import { Student } from "../students/entities/student.entity";

@Module({
  imports: [TypeOrmModule.forFeature([PointRule, PointTransaction, Student, Mosque])],
  controllers: [PointsController],
  providers: [PointsService, PointsSeederService],
  exports: [PointsService],
})
export class PointsModule {}
