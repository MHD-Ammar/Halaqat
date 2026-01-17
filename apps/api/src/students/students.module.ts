/**
 * Students Module
 *
 * Module for managing students in study circles.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { StudentsController } from "./students.controller";
import { StudentsService } from "./students.service";
import { Student } from "./entities/student.entity";
import { CirclesModule } from "../circles/circles.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Student]),
    CirclesModule, // For ownership validation
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
