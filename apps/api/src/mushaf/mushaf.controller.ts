/**
 * Mushaf Controller
 *
 * REST API endpoints for the Interactive Mushaf feature.
 * Handles Mushaf reading state persistence and word-level mistake management.
 *
 * Base route: /mushaf
 */

import { UserRole } from "@halaqat/types";
import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";

import { BulkCreateMistakesDto } from "./dto/bulk-create-mistakes.dto";
import { GetMistakesQueryDto } from "./dto/get-mistakes-query.dto";
import { UpdateMushafStateDto } from "./dto/update-mushaf-state.dto";
import { MushafService } from "./mushaf.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@ApiTags("Mushaf")
@ApiBearerAuth("JWT-auth")
@Controller("mushaf")
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class MushafController {
  constructor(private readonly mushafService: MushafService) {}

  // ── Student Endpoints ───────────────────────────────────────────

  /**
   * GET /mushaf/state
   * Get the current student's Mushaf reading state
   */
  @Get("state")
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: "Get my Mushaf state",
    description: "Returns the student's last reading position. Creates default (page 1) if none exists.",
  })
  @ApiResponse({ status: 200, description: "Mushaf state returned" })
  async getMyState(@CurrentUser() user: { id: string; studentId: string }) {
    return this.mushafService.getState(user.studentId);
  }

  /**
   * PATCH /mushaf/state
   * Update the current student's Mushaf reading state
   */
  @Patch("state")
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: "Update my Mushaf state",
    description: "Persists the current page the student is reading.",
  })
  @ApiResponse({ status: 200, description: "State updated" })
  async updateMyState(
    @CurrentUser() user: { id: string; studentId: string },
    @Body() dto: UpdateMushafStateDto
  ) {
    return this.mushafService.updateState(user.studentId, dto);
  }

  // ── Teacher Endpoints ───────────────────────────────────────────

  /**
   * GET /mushaf/state/:studentId
   * Get a specific student's Mushaf reading state (teacher access)
   */
  @Get("state/:studentId")
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: "Get student's Mushaf state",
    description: "Returns the reading position for a specific student.",
  })
  @ApiParam({ name: "studentId", description: "Student UUID" })
  @ApiResponse({ status: 200, description: "Mushaf state returned" })
  async getStudentState(@Param("studentId", ParseUUIDPipe) studentId: string) {
    return this.mushafService.getState(studentId);
  }

  /**
   * PATCH /mushaf/state/:studentId
   * Update a specific student's Mushaf reading state (teacher access)
   */
  @Patch("state/:studentId")
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: "Update student's Mushaf state",
    description: "Persists the page for a specific student during a session.",
  })
  @ApiParam({ name: "studentId", description: "Student UUID" })
  @ApiResponse({ status: 200, description: "State updated" })
  async updateStudentState(
    @Param("studentId", ParseUUIDPipe) studentId: string,
    @Body() dto: UpdateMushafStateDto
  ) {
    return this.mushafService.updateState(studentId, dto);
  }

  /**
   * GET /mushaf/mistakes/:studentId
   * Get all word-level mistakes for a student (with optional page/surah filter)
   */
  @Get("mistakes/:studentId")
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.STUDENT)
  @ApiOperation({
    summary: "Get student mistakes",
    description: "Returns word-level mistakes for a student, optionally filtered by page or surah.",
  })
  @ApiParam({ name: "studentId", description: "Student UUID" })
  @ApiQuery({ name: "pageNumber", required: false, description: "Filter by page (1-604)" })
  @ApiQuery({ name: "surahNumber", required: false, description: "Filter by surah (1-114)" })
  @ApiResponse({ status: 200, description: "List of mistakes" })
  async getStudentMistakes(
    @Param("studentId", ParseUUIDPipe) studentId: string,
    @Query() query: GetMistakesQueryDto
  ) {
    return this.mushafService.getMistakes(studentId, query);
  }

  /**
   * POST /mushaf/mistakes/bulk
   * Bulk-insert word-level mistakes (teacher assessor)
   */
  @Post("mistakes/bulk")
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: "Bulk create mistakes",
    description: "Insert multiple word-level mistakes at once, linked to a recitation.",
  })
  @ApiResponse({ status: 201, description: "Mistakes created" })
  @ApiResponse({ status: 400, description: "Validation error" })
  async bulkCreateMistakes(@Body() dto: BulkCreateMistakesDto) {
    return this.mushafService.bulkCreateMistakes(dto);
  }

  /**
   * DELETE /mushaf/mistakes/:id
   * Soft-delete a single mistake
   */
  @Delete("mistakes/:id")
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: "Delete a mistake",
    description: "Soft-deletes a specific word-level mistake.",
  })
  @ApiParam({ name: "id", description: "Mistake UUID" })
  @ApiResponse({ status: 200, description: "Mistake soft-deleted" })
  @ApiResponse({ status: 404, description: "Mistake not found" })
  async deleteMistake(@Param("id", ParseUUIDPipe) id: string) {
    await this.mushafService.deleteMistake(id);
    return { success: true };
  }
}
