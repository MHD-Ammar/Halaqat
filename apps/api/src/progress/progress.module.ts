/**
 * Progress Module
 *
 * Module for tracking student progress (recitations).
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProgressController } from "./progress.controller";
import { ProgressService } from "./progress.service";
import { Recitation } from "./entities/recitation.entity";
import { PointsModule } from "../points/points.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Recitation]),
    PointsModule, // For auto-awarding points
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
