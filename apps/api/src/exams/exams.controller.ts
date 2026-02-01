/**
 * Exams Controller
 *
 * REST API endpoints for managing exams in the Quran Testing System.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UserRole } from "@halaqat/types";

import { ExamsService } from "./exams.service";
import { CreateExamDto } from "./dto/create-exam.dto";
import { SubmitExamDto } from "./dto/submit-exam.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("exams")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller("exams")
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Roles(UserRole.EXAMINER, UserRole.ADMIN)
  @ApiOperation({ summary: "Create a new exam session" })
  @ApiResponse({ status: 201, description: "Exam created successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Examiner role required",
  })
  create(
    @CurrentUser() user: { id: string; mosqueId?: string },
    @Body() createExamDto: CreateExamDto,
  ) {
    return this.examsService.createExam(user.id, createExamDto, user.mosqueId);
  }

  /**
   * Get all exams (with optional filters)
   */
  @Get()
  @Roles(UserRole.EXAMINER, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: "Get all exams with optional filters" })
  findAll(
    @Query("studentId") studentId?: string,
    @Query("juzNumber") juzNumber?: number,
  ) {
    return this.examsService.findAll(studentId, juzNumber);
  }

  /**
   * Search students for exam
   */
  @Get("search")
  @Roles(UserRole.EXAMINER, UserRole.ADMIN)
  @ApiOperation({ summary: "Search students by name or ID" })
  search(
    @Query("q") query: string,
    @CurrentUser() user: { mosqueId?: string },
  ) {
    return this.examsService.searchStudents(query, user.mosqueId);
  }

  /**
   * Get recent exams
   */
  @Get("recent")
  @Roles(UserRole.EXAMINER, UserRole.ADMIN)
  @ApiOperation({ summary: "Get recent exams" })
  getRecent(@CurrentUser() user: { mosqueId?: string }) {
    return this.examsService.getRecentExams(user.mosqueId);
  }

  /**
   * Get student exam card (grouped by Juz)
   */
  @Get("student/:studentId/card")
  @Roles(UserRole.EXAMINER, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: "Get student exam card history" })
  getStudentCard(@Param("studentId", ParseUUIDPipe) studentId: string) {
    return this.examsService.getStudentExamCard(studentId);
  }

  /**
   * Submit an exam with questions and scores
   */
  @Post(":id/submit")
  @Roles(UserRole.EXAMINER, UserRole.ADMIN)
  @ApiOperation({ summary: "Submit exam with questions and scoring" })
  @ApiResponse({ status: 200, description: "Exam submitted successfully" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  submit(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() submitExamDto: SubmitExamDto,
  ) {
    return this.examsService.submitExam(id, submitExamDto);
  }

  /**
   * Get an exam by ID
   */
  @Get(":id")
  @Roles(UserRole.EXAMINER, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: "Get exam by ID" })
  @ApiResponse({ status: 200, description: "Exam found" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.examsService.findOne(id);
  }

  /**
   * Get all exams for a student
   */
  @Get("student/:studentId")
  @Roles(UserRole.EXAMINER, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: "Get all exams for a student" })
  @ApiResponse({ status: 200, description: "List of student exams" })
  findByStudent(@Param("studentId", ParseUUIDPipe) studentId: string) {
    return this.examsService.findByStudent(studentId);
  }
}
