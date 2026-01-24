/**
 * Sessions Controller
 *
 * REST API endpoints for managing daily sessions and attendance.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
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
  ApiQuery,
} from "@nestjs/swagger";

import { SessionsService } from "./sessions.service";
import { BulkAttendanceDto } from "./dto/bulk-attendance.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Sessions")
@ApiBearerAuth("JWT-auth")
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
  @ApiOperation({
    summary: "Get today's session",
    description:
      "Get today's session for a circle. Returns null if not started.",
  })
  @ApiQuery({ name: "circleId", description: "Circle UUID", required: true })
  @ApiResponse({ status: 200, description: "Session details or empty" })
  findToday(@Query("circleId", ParseUUIDPipe) circleId: string) {
    return this.sessionsService.findTodaySession(circleId);
  }

  /**
   * Start today's session
   * POST /api/sessions/today
   */
  @Post("today")
  @ApiOperation({
    summary: "Start today's session",
    description:
      "Explicitly start a session for today. Creates attendance records.",
  })
  @ApiQuery({ name: "circleId", description: "Circle UUID", required: true })
  @ApiResponse({ status: 201, description: "Session created" })
  createToday(@Query("circleId", ParseUUIDPipe) circleId: string) {
    return this.sessionsService.createTodaySession(circleId);
  }

  /**
   * Get session history for a circle
   * GET /api/sessions/history?circleId=...
   */
  @Get("history")
  @ApiOperation({
    summary: "Get session history",
    description: "Get past sessions for a circle",
  })
  @ApiQuery({ name: "circleId", description: "Circle UUID", required: true })
  @ApiQuery({
    name: "limit",
    description: "Number of sessions to return",
    required: false,
  })
  @ApiResponse({ status: 200, description: "List of past sessions" })
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
  @ApiOperation({
    summary: "Get session by ID",
    description: "Get a single session with attendance",
  })
  @ApiParam({ name: "id", description: "Session UUID" })
  @ApiResponse({ status: 200, description: "Session details" })
  @ApiResponse({ status: 404, description: "Session not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.sessionsService.findOne(id);
  }

  /**
   * Bulk update attendance for a session
   * PATCH /api/sessions/:id/attendance
   */
  @Patch(":id/attendance")
  @ApiOperation({
    summary: "Update attendance",
    description: "Bulk update attendance status for students in a session",
  })
  @ApiParam({ name: "id", description: "Session UUID" })
  @ApiResponse({ status: 200, description: "Attendance updated successfully" })
  @ApiResponse({ status: 404, description: "Session not found" })
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
  @ApiOperation({
    summary: "Close session",
    description: "Mark a session as closed",
  })
  @ApiParam({ name: "id", description: "Session UUID" })
  @ApiResponse({ status: 200, description: "Session closed successfully" })
  @ApiResponse({ status: 404, description: "Session not found" })
  closeSession(@Param("id", ParseUUIDPipe) id: string) {
    return this.sessionsService.closeSession(id);
  }
}
