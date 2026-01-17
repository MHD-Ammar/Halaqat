/**
 * Sessions Controller
 *
 * REST API endpoints for managing daily sessions and attendance.
 */

import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";

import { SessionsService } from "./sessions.service";
import { BulkAttendanceDto } from "./dto/bulk-attendance.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("sessions")
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * Get or create today's session for a circle
   * GET /api/sessions/today?circleId=...
   *
   * This is the main endpoint for the Mobile "Attendance" screen.
   * Smart initialization: creates session + attendance records if needed.
   */
  @Get("today")
  findOrCreateToday(@Query("circleId", ParseUUIDPipe) circleId: string) {
    return this.sessionsService.findOrCreateTodaySession(circleId);
  }

  /**
   * Get session history for a circle
   * GET /api/sessions/history?circleId=...
   */
  @Get("history")
  getHistory(
    @Query("circleId", ParseUUIDPipe) circleId: string,
    @Query("limit") limit?: string,
  ) {
    return this.sessionsService.getSessionHistory(
      circleId,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  /**
   * Get a single session by ID
   * GET /api/sessions/:id
   */
  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.sessionsService.findOne(id);
  }

  /**
   * Bulk update attendance for a session
   * PATCH /api/sessions/:id/attendance
   */
  @Patch(":id/attendance")
  updateAttendance(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() bulkDto: BulkAttendanceDto,
  ) {
    return this.sessionsService.updateBulkAttendance(id, bulkDto);
  }

  /**
   * Close a session
   * PATCH /api/sessions/:id/close
   */
  @Patch(":id/close")
  closeSession(@Param("id", ParseUUIDPipe) id: string) {
    return this.sessionsService.closeSession(id);
  }
}
