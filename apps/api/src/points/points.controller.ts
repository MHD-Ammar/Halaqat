/**
 * Points Controller
 *
 * REST API endpoints for managing points and point rules.
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
import { UserRole } from "@halaqat/types";

import { PointsService } from "./points.service";
import { AddManualPointsDto } from "./dto/add-manual-points.dto";
import { UpdatePointRuleDto } from "./dto/update-point-rule.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Points")
@ApiBearerAuth("JWT-auth")
@Controller("points")
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  // ==================== POINT RULES (Admin) ====================

  /**
   * Get all point rules
   * GET /api/points/rules
   */
  @Get("rules")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Get all point rules",
    description: "Get all point rules (Admin only)",
  })
  @ApiResponse({ status: 200, description: "List of point rules" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  findAllRules() {
    return this.pointsService.findAllRules();
  }

  /**
   * Update a point rule
   * PATCH /api/points/rules/:key
   */
  @Patch("rules/:key")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Update point rule",
    description: "Update a point rule by key (Admin only)",
  })
  @ApiParam({ name: "key", description: "Point rule key" })
  @ApiResponse({ status: 200, description: "Point rule updated" })
  @ApiResponse({ status: 404, description: "Rule not found" })
  updateRule(@Param("key") key: string, @Body() dto: UpdatePointRuleDto) {
    return this.pointsService.updateRule(key, dto);
  }

  // ==================== MANUAL POINTS ====================

  /**
   * Add manual points (with budget enforcement)
   * POST /api/points/manual
   */
  @Post("manual")
  @ApiOperation({
    summary: "Add manual points",
    description: "Add bonus/penalty points to a student (with budget limits)",
  })
  @ApiResponse({ status: 201, description: "Points added successfully" })
  @ApiResponse({
    status: 400,
    description: "Budget exceeded or validation error",
  })
  addManualPoints(
    @Body() dto: AddManualPointsDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.pointsService.addManualPoints(dto, user.sub);
  }

  // ==================== POINT HISTORY ====================

  /**
   * Get point history for a student
   * GET /api/points/history/:studentId
   */
  @Get("history/:studentId")
  @ApiOperation({
    summary: "Get point history",
    description: "Get point history for a student",
  })
  @ApiParam({ name: "studentId", description: "Student UUID" })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Max records to return",
  })
  @ApiResponse({ status: 200, description: "List of point transactions" })
  getStudentHistory(
    @Param("studentId", ParseUUIDPipe) studentId: string,
    @Query("limit") limit?: string,
  ) {
    return this.pointsService.getStudentHistory(
      studentId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  /**
   * Get student's total points
   * GET /api/points/total/:studentId
   */
  @Get("total/:studentId")
  @ApiOperation({
    summary: "Get total points",
    description: "Get student's total point balance",
  })
  @ApiParam({ name: "studentId", description: "Student UUID" })
  @ApiResponse({ status: 200, description: "Total points" })
  getStudentTotalPoints(@Param("studentId", ParseUUIDPipe) studentId: string) {
    return this.pointsService.getStudentTotalPoints(studentId);
  }
}
