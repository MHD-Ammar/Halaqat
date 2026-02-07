/**
 * Points Controller
 *
 * REST API endpoints for managing points and point rules.
 */

import { UserRole } from "@halaqat/types";
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { AddManualPointsDto } from "./dto/add-manual-points.dto";
import { BulkUpdatePointRulesDto } from "./dto/bulk-update-point-rules.dto";
import { UpdatePointRuleDto } from "./dto/update-point-rule.dto";
import { PointsService } from "./points.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@ApiTags("Points")
@ApiBearerAuth("JWT-auth")
@Controller("points")
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  // ==================== POINT RULES (Admin) ====================

  /**
   * Get all point rules for the current user's mosque
   * GET /api/points/rules
   */
  @Get("rules")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Get all point rules",
    description: "Get all point rules for the current user's mosque (Admin only)",
  })
  @ApiResponse({ status: 200, description: "List of point rules" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  findAllRules(@CurrentUser() user: { mosqueId: string }) {
    return this.pointsService.findAllRules(user.mosqueId);
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
  updateRule(
    @Param("key") key: string,
    @Body() dto: UpdatePointRuleDto,
    @CurrentUser() user: { mosqueId: string },
  ) {
    return this.pointsService.updateRule(key, user.mosqueId, dto);
  }

  /**
   * Bulk update point rules
   * PUT /api/points/rules
   */
  @Put("rules")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Bulk update point rules",
    description: "Update multiple point rules at once (Admin only)",
  })
  @ApiResponse({ status: 200, description: "Point rules updated" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  async bulkUpdateRules(
    @Body() dto: BulkUpdatePointRulesDto,
    @CurrentUser() user: { mosqueId: string },
  ) {
    const updatedRules = await this.pointsService.bulkUpdateRules(user.mosqueId, dto);
    return {
      message: "Point rules updated successfully",
      data: updatedRules,
    };
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
