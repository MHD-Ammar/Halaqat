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
import { UserRole } from "@halaqat/types";

import { PointsService } from "./points.service";
import { AddManualPointsDto } from "./dto/add-manual-points.dto";
import { UpdatePointRuleDto } from "./dto/update-point-rule.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

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
  updateRule(@Param("key") key: string, @Body() dto: UpdatePointRuleDto) {
    return this.pointsService.updateRule(key, dto);
  }

  // ==================== MANUAL POINTS ====================

  /**
   * Add manual points (with budget enforcement)
   * POST /api/points/manual
   */
  @Post("manual")
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
  getStudentTotalPoints(@Param("studentId", ParseUUIDPipe) studentId: string) {
    return this.pointsService.getStudentTotalPoints(studentId);
  }
}
