/**
 * Analytics Controller
 *
 * Exposes analytics endpoints for Admin/Supervisor dashboard.
 */

import { Controller, Get, UseGuards } from "@nestjs/common";
import { UserRole } from "@halaqat/types";

import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

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
  async getOverview() {
    const data = await this.analyticsService.getDailyOverview();
    return {
      message: "Daily overview retrieved successfully",
      data,
    };
  }

  /**
   * GET /analytics/my-overview
   * Returns daily statistics for the current teacher's circles only
   */
  @Get("my-overview")
  @Roles(UserRole.TEACHER)
  async getMyOverview(@CurrentUser() user: { sub: string }) {
    const data = await this.analyticsService.getTeacherStats(user.sub);
    return {
      message: "Teacher overview retrieved successfully",
      data,
    };
  }

  /**
   * GET /analytics/teachers
   * Returns performance data for all teachers
   */
  @Get("teachers")
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async getTeacherPerformance() {
    const data = await this.analyticsService.getTeacherPerformance();
    return {
      message: "Teacher performance retrieved successfully",
      data,
    };
  }
}
