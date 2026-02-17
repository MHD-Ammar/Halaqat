import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RamadanSubmission } from "./entities/ramadan-submission.entity";
import { RamadanController } from "./ramadan.controller";
import { RamadanService } from "./ramadan.service";
import { Circle } from "../circles/entities/circle.entity";
import { Mosque } from "../mosques/entities/mosque.entity";
import { Student } from "../students/entities/student.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([RamadanSubmission, Student, Circle, Mosque]),
  ],
  controllers: [RamadanController],
  providers: [RamadanService],
})
export class RamadanModule {}
