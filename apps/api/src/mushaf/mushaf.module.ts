/**
 * Mushaf Module
 *
 * Encapsulates all Interactive Mushaf functionality.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RecitationMistake } from "./entities/recitation-mistake.entity";
import { StudentMushafState } from "./entities/student-mushaf-state.entity";
import { MushafController } from "./mushaf.controller";
import { MushafService } from "./mushaf.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentMushafState, RecitationMistake]),
  ],
  controllers: [MushafController],
  providers: [MushafService],
  exports: [MushafService],
})
export class MushafModule {}
