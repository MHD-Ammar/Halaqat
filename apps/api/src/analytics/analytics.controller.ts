/**
 * Analytics Controller
 *
 * Exposes analytics endpoints for Admin/Supervisor dashboard.
 */

import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UserRole } from "@halaqat/types";

import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Analytics")
@ApiBearerAuth("JWT-auth")
@Controller("analytics")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /analytics/overview
   * Returns daily statistics for the entire mosque
   */
  @Get("overview")
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: "Get daily overview",
    description: "Get mosque-wide daily statistics (Admin/Supervisor)",
  })
  @ApiResponse({ status: 200, description: "Daily overview statistics" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - requires ADMIN or SUPERVISOR role",
  })
  async getOverview(@CurrentUser() user: { mosqueId?: string }) {
    const data = await this.analyticsService.getDailyOverview(user.mosqueId);
    return {
      message: "Daily overview retrieved successfully",
      data,
    };
  }

  /**
   * GET /analytics/my-overview
   * Returns role-based statistics for the current user
   * - Admin: Mosque-wide stats
   * - Teacher: Circle-specific stats
   * - Examiner: Exam stats
   */
  @Get("my-overview")
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.EXAMINER)
  @ApiOperation({
    summary: "Get role-based overview",
    description: "Get daily stats based on user role (Admin/Teacher/Examiner)",
  })
  @ApiResponse({ status: 200, description: "Role-based statistics" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - requires ADMIN, TEACHER, or EXAMINER role",
  })
  async getMyOverview(
    @CurrentUser() user: { id: string; role: string; mosqueId?: string },
  ) {
    console.log(user);
    const data = await this.analyticsService.getRoleBasedOverview(
      user.id,
      user.role,
      user.mosqueId,
    );
    return {
      message: "Overview retrieved successfully",
      data,
    };
  }

  /**
   * GET /analytics/teachers
   * Returns performance data for all teachers
   */
  @Get("teachers")
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: "Get teacher performance",
    description: "Get performance metrics for all teachers (Admin/Supervisor)",
  })
  @ApiResponse({ status: 200, description: "Teacher performance data" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - requires ADMIN or SUPERVISOR role",
  })
  async getTeacherPerformance(@CurrentUser() user: { mosqueId?: string }) {
    const data = await this.analyticsService.getTeacherPerformance(
      user.mosqueId,
    );
    return {
      message: "Teacher performance retrieved successfully",
      data,
    };
  }
}
