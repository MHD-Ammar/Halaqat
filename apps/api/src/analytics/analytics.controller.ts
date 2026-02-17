/**
 * Analytics Controller
 *
 * Exposes analytics endpoints for Admin/Supervisor and Teacher dashboards.
 */

import { UserRole } from "@halaqat/types";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";

import { AnalyticsService } from "./analytics.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

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

  /**
   * GET /analytics/teacher-dashboard
   * Returns comprehensive dashboard data for a teacher within a date range
   */
  @Get("teacher-dashboard")
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: "Get teacher dashboard",
    description:
      "Get comprehensive dashboard stats for a teacher with date range filtering",
  })
  @ApiQuery({
    name: "from",
    required: false,
    description: "Start date (YYYY-MM-DD), defaults to 7 days ago",
  })
  @ApiQuery({
    name: "to",
    required: false,
    description: "End date (YYYY-MM-DD), defaults to today",
  })
  @ApiResponse({ status: 200, description: "Teacher dashboard data" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - requires TEACHER role",
  })
  async getTeacherDashboard(
    @CurrentUser() user: { id: string; mosqueId?: string },
    @Query("from") fromStr?: string,
    @Query("to") toStr?: string,
  ) {
    // Default to last 7 days if not provided
    const to = toStr ? new Date(toStr) : new Date();
    const from = fromStr
      ? new Date(fromStr)
      : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Normalize dates to start/end of day
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    const data = await this.analyticsService.getTeacherDashboard(
      user.id,
      user.mosqueId,
      from,
      to,
    );
    return {
      message: "Teacher dashboard retrieved successfully",
      data,
    };
  }
}

