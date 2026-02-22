/**
 * Sessions Controller
 *
 * REST API endpoints for managing daily sessions and attendance.
 */

import { UserRole } from "@halaqat/types";
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

import { BulkAttendanceDto } from "./dto/bulk-attendance.dto";
import { SessionsService } from "./sessions.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@ApiTags("Sessions")
@ApiBearerAuth("JWT-auth")
@Controller("sessions")
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: "Get today's session",
    description:
      "Get today's session for a circle. Returns null if not started.",
  })
  @ApiQuery({ name: "circleId", description: "Circle UUID", required: true })
  @ApiResponse({ status: 200, description: "Session details or empty" })
  findToday(
    @Query("circleId", ParseUUIDPipe) circleId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const teacherId = user.role === UserRole.TEACHER ? user.id : undefined;
    return this.sessionsService.findTodaySession(circleId, teacherId);
  }

  /**
   * Start today's session
   * POST /api/sessions/today
   */
  @Post("today")
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: "Start today's session",
    description:
      "Explicitly start a session for today. Creates attendance records.",
  })
  @ApiQuery({ name: "circleId", description: "Circle UUID", required: true })
  @ApiResponse({ status: 201, description: "Session created" })
  createToday(
    @Query("circleId", ParseUUIDPipe) circleId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const teacherId = user.role === UserRole.TEACHER ? user.id : undefined;
    return this.sessionsService.createTodaySession(circleId, teacherId);
  }

  /**
   * Get session history for a circle
   * GET /api/sessions/history?circleId=...
   */
  @Get("history")
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERVISOR)
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
    @CurrentUser() user?: { id: string; role: UserRole },
  ) {
    const teacherId = user?.role === UserRole.TEACHER ? user.id : undefined;
    return this.sessionsService.getSessionHistory(
      circleId,
      limit ? parseInt(limit, 10) : 30,
      teacherId,
    );
  }

  /**
   * Get a single session by ID
   * GET /api/sessions/:id
   */
  @Get(":id")
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: "Get session by ID",
    description: "Get a single session with attendance",
  })
  @ApiParam({ name: "id", description: "Session UUID" })
  @ApiResponse({ status: 200, description: "Session details" })
  @ApiResponse({ status: 404, description: "Session not found" })
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const teacherId = user.role === UserRole.TEACHER ? user.id : undefined;
    return this.sessionsService.findOne(id, teacherId);
  }

  /**
   * Bulk update attendance for a session
   * PATCH /api/sessions/:id/attendance
   */
  @Patch(":id/attendance")
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERVISOR)
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
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const teacherId = user.role === UserRole.TEACHER ? user.id : undefined;
    return this.sessionsService.updateBulkAttendance(id, bulkDto, teacherId);
  }

  /**
   * Close a session
   * PATCH /api/sessions/:id/close
   */
  @Patch(":id/close")
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: "Close session",
    description: "Mark a session as closed",
  })
  @ApiParam({ name: "id", description: "Session UUID" })
  @ApiResponse({ status: 200, description: "Session closed successfully" })
  @ApiResponse({ status: 404, description: "Session not found" })
  closeSession(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const teacherId = user.role === UserRole.TEACHER ? user.id : undefined;
    return this.sessionsService.closeSession(id, teacherId);
  }
}
