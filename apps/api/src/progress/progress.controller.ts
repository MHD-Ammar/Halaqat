/**
 * Progress Controller
 *
 * REST API endpoints for recording and viewing recitations.
 * Uses Madinah Mushaf pages (1-604) for tracking.
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";

import { ProgressService } from "./progress.service";
import { RecordRecitationDto } from "./dto/record-recitation.dto";
import { BulkRecitationDto } from "./dto/bulk-recitation.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Progress")
@ApiBearerAuth("JWT-auth")
@Controller("progress")
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /**
   * Record a single page recitation (auto-awards points)
   * POST /api/progress/recitations
   */
  @Post("recitations")
  @ApiOperation({
    summary: "Record recitation",
    description:
      "Record a single page recitation and auto-award points based on quality",
  })
  @ApiResponse({ status: 201, description: "Recitation recorded successfully" })
  @ApiResponse({ status: 400, description: "Validation error" })
  recordRecitation(@Body() dto: RecordRecitationDto) {
    return this.progressService.recordRecitation(dto);
  }

  /**
   * Record multiple pages in bulk (each page gets separate points)
   * POST /api/progress/recitations/bulk
   */
  @Post("recitations/bulk")
  @ApiOperation({
    summary: "Record bulk recitation",
    description:
      "Record multiple pages at once. Each page gets separate point calculations.",
  })
  @ApiResponse({
    status: 201,
    description: "Recitations recorded successfully",
  })
  @ApiResponse({ status: 400, description: "Validation error" })
  recordBulkRecitation(@Body() dto: BulkRecitationDto) {
    return this.progressService.recordBulkRecitation(dto);
  }

  /**
   * Get a single recitation by ID
   * GET /api/progress/recitations/:id
   */
  @Get("recitations/:id")
  @ApiOperation({
    summary: "Get recitation by ID",
    description: "Get a single recitation record",
  })
  @ApiParam({ name: "id", description: "Recitation UUID" })
  @ApiResponse({ status: 200, description: "Recitation details" })
  @ApiResponse({ status: 404, description: "Recitation not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.progressService.findOne(id);
  }

  /**
   * Get all recitations for a student
   * GET /api/progress/students/:studentId/recitations
   */
  @Get("students/:studentId/recitations")
  @ApiOperation({
    summary: "Get student recitations",
    description: "Get all recitations for a specific student",
  })
  @ApiParam({ name: "studentId", description: "Student UUID" })
  @ApiResponse({ status: 200, description: "List of student's recitations" })
  getStudentRecitations(@Param("studentId", ParseUUIDPipe) studentId: string) {
    return this.progressService.getStudentRecitations(studentId);
  }

  /**
   * Get all recitations for a session
   * GET /api/progress/sessions/:sessionId/recitations
   */
  @Get("sessions/:sessionId/recitations")
  @ApiOperation({
    summary: "Get session recitations",
    description: "Get all recitations from a specific session",
  })
  @ApiParam({ name: "sessionId", description: "Session UUID" })
  @ApiResponse({ status: 200, description: "List of session's recitations" })
  getSessionRecitations(@Param("sessionId", ParseUUIDPipe) sessionId: string) {
    return this.progressService.getSessionRecitations(sessionId);
  }

  /**
   * Get total distinct pages memorized by a student
   * GET /api/progress/students/:studentId/total-pages
   */
  @Get("students/:studentId/total-pages")
  @ApiOperation({
    summary: "Get total pages",
    description: "Get count of distinct pages memorized by a student",
  })
  @ApiParam({ name: "studentId", description: "Student UUID" })
  @ApiResponse({ status: 200, description: "Total pages count" })
  getTotalPages(@Param("studentId", ParseUUIDPipe) studentId: string) {
    return this.progressService.getTotalPagesMemorized(studentId);
  }
}
