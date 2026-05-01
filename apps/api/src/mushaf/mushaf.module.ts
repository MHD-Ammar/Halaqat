/**
 * Mushaf Module
 *
 * Encapsulates all Interactive Mushaf functionality.
 *
 * Imports:
 * - StudentMushafState + RecitationMistake → owned by this module.
 * - Recitation → required so the service can re-derive `mistakesCount`
 *   on the parent recitation whenever bulk-create / delete fires. We
 *   pull in the entity (not the whole ProgressModule) to avoid a
 *   circular import.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";


import { RecitationMistake } from "./entities/recitation-mistake.entity";
import { StudentMushafState } from "./entities/student-mushaf-state.entity";
import { MushafController } from "./mushaf.controller";
import { MushafService } from "./mushaf.service";
import { Recitation } from "../progress/entities/recitation.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentMushafState,
      RecitationMistake,
      Recitation,
    ]),
  ],
  controllers: [MushafController],
  providers: [MushafService],
  exports: [MushafService],
})
export class MushafModule {}
