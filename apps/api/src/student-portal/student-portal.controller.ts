/**
 * Student Portal Controller
 *
 * Secured REST API endpoints for student-facing portal features.
 * All endpoints require JWT authentication and STUDENT role.
 *
 * Base route: /student-portal
 */

import { UserRole } from "@halaqat/types";
import {
  Controller,
  Get,
  Post,
  Body,
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

import { SubmitStudentQuestDto } from "./dto/submit-student-quest.dto";
import { StudentPortalService } from "./student-portal.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@ApiTags("Student Portal")
@ApiBearerAuth("JWT-auth")
@Controller("student-portal")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@UseInterceptors(ClassSerializerInterceptor)
export class StudentPortalController {
  constructor(private readonly studentPortalService: StudentPortalService) {}

  /**
   * GET /student-portal/quests/today
   *
   * Fetch today's quest status and the campaign config
   *
   * Response: {
   *   hasSubmittedToday: boolean,
   *   todayXpEarned?: number,
   *   config: ChallengeConfig
   * }
   */
  @Get("quests/today")
  @ApiOperation({
    summary: "Get today's quest status",
    description:
      "Fetch whether the student has submitted today, XP earned, and the campaign config to render the form.",
  })
  @ApiResponse({
    status: 200,
    description: "Quest status and config returned",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - STUDENT role required" })
  async getTodayQuests(
    @CurrentUser() user: { id: string; studentId: string },
  ) {
    return this.studentPortalService.getTodayQuests(
      user.studentId,
    );
  }

  /**
   * POST /student-portal/quests/submit
   *
   * Submit daily quests with full gamification transaction.
   *
   * Request Body:
   * {
   *   submissionData: { ... },
   *   campaignKey?: string,
   *   localDate?: string
   * }
   *
   * Response: {
   *   success: true,
   *   earnedXp: number,
   *   newTotalXp: number,
   *   levelUp: boolean,
   *   newLevel: number,
   *   currentStreak: number,
   *   maxStreak: number
   * }
   */
  @Post("quests/submit")
  @ApiOperation({
    summary: "Submit daily quests",
    description:
      "Submit completed quests. Calculates XP, updates level, and streak atomically.",
  })
  @ApiResponse({
    status: 201,
    description: "Submission successful with gamification updates",
  })
  @ApiResponse({
    status: 400,
    description: "Already submitted today or invalid data",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - STUDENT role required" })
  async submitQuest(
    @CurrentUser() user: { id: string; studentId: string },
    @Body() dto: SubmitStudentQuestDto,
  ) {
    return this.studentPortalService.submitQuest(user.studentId, dto);
  }

  /**
   * POST /student-portal/claim-login-bonus
   *
   * Claim daily login bonus
   *
   * Response: {
   *   claimed: boolean,
   *   xpAwarded?: number,
   *   newTotalXp?: number,
   *   levelUp?: boolean,
   *   newLevel?: number
   * }
   */
  @Post("claim-login-bonus")
  @ApiOperation({
    summary: "Claim daily login bonus",
    description: "Awards XP if the student hasn't claimed the bonus today.",
  })
  @ApiResponse({
    status: 201,
    description: "Bonus logic executed successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async claimLoginBonus(@CurrentUser() user: { id: string; studentId: string }) {
    return this.studentPortalService.claimLoginBonus(user.studentId);
  }

  /**
   * GET /student-portal/dashboard
   *
   * Fetch aggregated data for the student dashboard.
   */
  @Get("dashboard")
  @ApiOperation({
    summary: "Get student dashboard data",
    description: "Aggregated data including streak, recitations, and more.",
  })
  @ApiResponse({
    status: 200,
    description: "Dashboard data returned",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async getDashboard(
    @CurrentUser() user: { id: string; studentId: string },
  ) {
    return this.studentPortalService.getDashboardData(user.studentId);
  }
}
