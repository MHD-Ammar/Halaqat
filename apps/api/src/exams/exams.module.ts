/**
 * Exams Module
 *
 * Module for managing exams in the Quran Testing System.
 * Provides exam creation, submission, and scoring functionality.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ExamQuestion } from "./entities/exam-question.entity";
import { Exam } from "./entities/exam.entity";
import { ExamsController } from "./exams.controller";
import { ExamsService } from "./exams.service";
import { StudentsModule } from "../students/students.module";

@Module({
  imports: [TypeOrmModule.forFeature([Exam, ExamQuestion]), StudentsModule],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
