/**
 * Student Portal Leaderboard Controller
 *
 * Provides endpoints for the Tri-Tier Leaderboard: Circle, League, and Global (Mosque).
 */

import { UserRole } from "@halaqat/types";
import {
  Controller,
  Get,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

import { StudentPortalLeaderboardService } from "./leaderboard.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@ApiTags("Student Portal")
@ApiBearerAuth("JWT-auth")
@Controller("student-portal/leaderboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@UseInterceptors(ClassSerializerInterceptor)
export class LeaderboardController {
  constructor(private readonly leaderboardService: StudentPortalLeaderboardService) {}

  @Get("circle")
  @ApiOperation({ summary: "Get Circle Leaderboard" })
  @ApiResponse({ status: 200, description: "Top 20 students in the same circle." })
  async getCircleLeaderboard(
    @CurrentUser() user: { id: string; studentId: string; mosqueId: string },
  ) {
    return this.leaderboardService.getCircleLeaderboard(user.studentId, user.mosqueId);
  }

  @Get("mosque")
  @ApiOperation({ summary: "Get Mosque (Global) Leaderboard" })
  @ApiResponse({ status: 200, description: "Top 50 students across the entire mosque." })
  async getMosqueLeaderboard(
    @CurrentUser() user: { id: string; studentId: string; mosqueId: string },
  ) {
    return this.leaderboardService.getMosqueLeaderboard(user.studentId, user.mosqueId);
  }

  @Get("league")
  @ApiOperation({ summary: "Get League Leaderboard" })
  @ApiResponse({ status: 200, description: "Top 30 students in the same league tier." })
  async getLeagueLeaderboard(
    @CurrentUser() user: { id: string; studentId: string; mosqueId: string },
  ) {
    return this.leaderboardService.getLeagueLeaderboard(user.studentId, user.mosqueId);
  }
}
