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

import { ProgressService } from "./progress.service";
import { RecordRecitationDto } from "./dto/record-recitation.dto";
import { BulkRecitationDto } from "./dto/bulk-recitation.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

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
  recordRecitation(@Body() dto: RecordRecitationDto) {
    return this.progressService.recordRecitation(dto);
  }

  /**
   * Record multiple pages in bulk (each page gets separate points)
   * POST /api/progress/recitations/bulk
   */
  @Post("recitations/bulk")
  recordBulkRecitation(@Body() dto: BulkRecitationDto) {
    return this.progressService.recordBulkRecitation(dto);
  }

  /**
   * Get a single recitation by ID
   * GET /api/progress/recitations/:id
   */
  @Get("recitations/:id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.progressService.findOne(id);
  }

  /**
   * Get all recitations for a student
   * GET /api/progress/students/:studentId/recitations
   */
  @Get("students/:studentId/recitations")
  getStudentRecitations(
    @Param("studentId", ParseUUIDPipe) studentId: string,
  ) {
    return this.progressService.getStudentRecitations(studentId);
  }

  /**
   * Get all recitations for a session
   * GET /api/progress/sessions/:sessionId/recitations
   */
  @Get("sessions/:sessionId/recitations")
  getSessionRecitations(
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
  ) {
    return this.progressService.getSessionRecitations(sessionId);
  }

  /**
   * Get total distinct pages memorized by a student
   * GET /api/progress/students/:studentId/total-pages
   */
  @Get("students/:studentId/total-pages")
  getTotalPages(@Param("studentId", ParseUUIDPipe) studentId: string) {
    return this.progressService.getTotalPagesMemorized(studentId);
  }
}
