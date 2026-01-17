/**
 * Curriculum Module
 *
 * Module for curriculum reference data (Surahs, etc.)
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CurriculumController } from "./curriculum.controller";
import { CurriculumService } from "./curriculum.service";
import { CurriculumSeederService } from "./curriculum-seeder.service";
import { Surah } from "./entities/surah.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Surah])],
  controllers: [CurriculumController],
  providers: [CurriculumService, CurriculumSeederService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
