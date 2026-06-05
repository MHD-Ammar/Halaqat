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
  Param,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Patch,
  Delete,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

import { SubmitStudentQuestDto } from "./dto/submit-student-quest.dto";
import { StudentPortalFacade } from "./student-portal.facade";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { StoreService } from "../gamification/store.service";
import { NotificationService } from "../notifications/notification.service";

@ApiTags("Student Portal")
@ApiBearerAuth("JWT-auth")
@Controller("student-portal")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@UseInterceptors(ClassSerializerInterceptor)
export class StudentPortalController {
  constructor(
    private readonly studentPortalService: StudentPortalFacade,
    private readonly storeService: StoreService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * GET /student-portal/quests
   *
   * Fetch all active quests grouped by category, with completion status
   * for the current student and time window (today for DAILY, this week for WEEKLY, ever for ONETIME).
   */
  @Get("quests")
  @ApiOperation({
    summary: "Get quests grouped by category",
    description:
      "Returns all active quests with completion status for the current student.",
  })
  @ApiResponse({ status: 200, description: "Grouped quests returned" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - STUDENT role required" })
  async getQuests(@CurrentUser() user: { id: string; studentId: string }) {
    return this.studentPortalService.getQuests(user.studentId);
  }

  /**
   * POST /student-portal/quests/:questId/complete
   *
   * Mark a quest as completed. Awards XP and updates level atomically.
   */
  @Post("quests/:questId/complete")
  @ApiOperation({
    summary: "Complete a quest",
    description:
      "Mark a quest as completed. Awards XP and updates level. Throws Conflict if already completed for the current period.",
  })
  @ApiResponse({ status: 201, description: "Quest completed successfully" })
  @ApiResponse({ status: 404, description: "Quest not found" })
  @ApiResponse({ status: 409, description: "Already completed for this period" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - STUDENT role required" })
  async completeQuest(
    @CurrentUser() user: { id: string; studentId: string },
    @Param("questId") questId: string,
  ) {
    return this.studentPortalService.completeQuest(user.studentId, questId);
  }

  /**
   * POST /student-portal/quests/:questId/log-progress
   *
   * Increment progress for a multi-step quest.
   */
  @Post("quests/:questId/log-progress")
  @ApiOperation({
    summary: "Log quest progress",
    description: "Increment progress for a multi-step quest. Awards XP only when target is reached.",
  })
  @ApiResponse({ status: 201, description: "Progress logged successfully" })
  @ApiResponse({ status: 404, description: "Quest not found" })
  @ApiResponse({ status: 409, description: "Already completed for this period" })
  @ApiResponse({ status: 400, description: "Invalid request (e.g. single-step quest)" })
  async logQuestProgress(
    @CurrentUser() user: { id: string; studentId: string },
    @Param("questId") questId: string,
    @Body() body: { amount?: number },
  ) {
    return this.studentPortalService.logQuestProgress(user.studentId, questId, body.amount);
  }

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
   * GET /student-portal/milestones
   *
   * Fetch all milestones for the current student
   */
  @Get("milestones")
  @ApiOperation({
    summary: "Get student milestones",
    description: "Returns all unlocked and claimed milestones for the student.",
  })
  @ApiResponse({ status: 200, description: "Milestones returned" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async getMilestones(@CurrentUser() user: { id: string; studentId: string }) {
    return this.studentPortalService.getStudentMilestones(user.studentId);
  }

  /**
   * GET /student-portal/achievements
   *
   * Fetch all achievements for the current student
   */
  @Get("achievements")
  @ApiOperation({
    summary: "Get student achievements",
    description: "Returns all achievements, with unlock status and dates for the student.",
  })
  @ApiResponse({ status: 200, description: "Achievements returned" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async getAchievements(@CurrentUser() user: { id: string; studentId: string }) {
    return this.studentPortalService.getAchievements(user.studentId);
  }

  /**
   * POST /student-portal/milestones/:id/claim
   *
   * Claim an unlocked milestone reward
   *
   * Response: {
   *   success: true,
   *   rewardDetails: { type, value, applied },
   *   newTotalXp?: number
   * }
   */
  @Post("milestones/:id/claim")
  @ApiOperation({
    summary: "Claim a milestone reward",
    description: "Marks a StudentMilestone as claimed and applies the reward (e.g. bonus XP).",
  })
  @ApiResponse({
    status: 201,
    description: "Milestone claimed successfully",
  })
  @ApiResponse({ status: 400, description: "Already claimed" })
  @ApiResponse({ status: 404, description: "Milestone not found or unlocked" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async claimMilestone(
    @CurrentUser() user: { id: string; studentId: string },
    @Param("id") milestoneId: string,
  ) {
    return this.studentPortalService.claimMilestone(user.studentId, milestoneId);
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

  @Get("league/last-week-result")
  @ApiOperation({
    summary: "Get last week league result",
    description: "Returns the unseen promotion/relegation/stay result from the previous week.",
  })
  async getLastWeekLeagueResult(
    @CurrentUser() user: { id: string; studentId: string; mosqueId: string },
  ) {
    return this.studentPortalService.getLastWeekLeagueResult(user.studentId, user.mosqueId);
  }

  @Post("league/last-week-result/seen")
  @ApiOperation({
    summary: "Mark last week league result as seen",
    description: "Marks the previous week result modal as acknowledged for this student.",
  })
  async markLastWeekLeagueResultSeen(
    @CurrentUser() user: { id: string; studentId: string; mosqueId: string },
  ) {
    return this.studentPortalService.markLastWeekLeagueResultSeen(user.studentId, user.mosqueId);
  }

  /**
   * GET /student-portal/dashboard
   *
   * Fetch aggregated data for the student dashboard.
   */
  @Get("dashboard")
  @ApiOperation({
    summary: "Get student dashboard data",
    description: "Returns aggregated stats, streak calendar, and recent recitations for the dashboard",
  })
  async getDashboard(
    @CurrentUser() user: { id: string; studentId: string },
  ) {
    return this.studentPortalService.getDashboardData(user.studentId);
  }

  /**
   * GET /student-portal/live-feed
   *
   * Fetch real social feed data
   */
  @Get("live-feed")
  @ApiOperation({
    summary: "Get live social feed",
    description: "Returns the 10 most recent gamification events.",
  })
  @ApiResponse({ status: 200, description: "Feed returned" })
  async getLiveFeed(
    @CurrentUser() user: { id: string; studentId: string },
  ) {
    return this.studentPortalService.getLiveFeed(user.studentId);
  }

  @Post("live-feed/:feedItemKey/react")
  async toggleFeedReaction(
    @CurrentUser() user: { id: string; studentId: string },
    @Param("feedItemKey") feedItemKey: string,
  ) {
    return this.studentPortalService.toggleFeedReaction(user.studentId, feedItemKey);
  }

  @Patch("recitation-reward/:id/seen")
  @ApiOperation({
    summary: "Mark recitation reward as seen",
    description: "Dismisses the surprise loot popup for a specific recitation",
  })
  async markRecitationRewardSeen(
    @CurrentUser() user: { id: string; studentId: string },
    @Param("id") recitationId: string,
  ) {
    return this.studentPortalService.markRecitationRewardSeen(
      user.studentId,
      recitationId,
    );
  }

  @Get("store")
  @ApiOperation({ summary: "Get available store items" })
  @ApiResponse({ status: 200, description: "Store items returned" })
  async getStoreItems(@CurrentUser() user: { id: string; studentId: string }) {
    const student = await this.studentPortalService.getStudent(user.studentId);
    return this.storeService.getStoreItems(user.studentId, student.mosqueId);
  }

  @Post("store/:itemId/purchase")
  @ApiOperation({ summary: "Purchase a store item" })
  @ApiResponse({ status: 201, description: "Item purchased successfully" })
  @ApiResponse({ status: 400, description: "Not enough XP or item out of stock" })
  async purchaseItem(
    @CurrentUser() user: { id: string; studentId: string },
    @Param("itemId") itemId: string,
  ) {
    return this.storeService.purchaseItem(user.studentId, itemId);
  }

  @Get("store/purchases")
  @ApiOperation({ summary: "Get personal purchase history" })
  @ApiResponse({ status: 200, description: "Purchase history returned" })
  async getMyPurchases(@CurrentUser() user: { id: string; studentId: string }) {
    return this.storeService.getStudentPurchases(user.studentId);
  }

  @Post("push/subscribe")
  @ApiOperation({ summary: "Subscribe to push notifications" })
  async subscribePush(
    @CurrentUser() user: { id: string; studentId: string },
    @Body() subscriptionData: any,
  ) {
    return this.notificationService.subscribe(user.studentId, subscriptionData);
  }

  @Delete("push/unsubscribe")
  @ApiOperation({ summary: "Unsubscribe from push notifications" })
  async unsubscribePush(
    @CurrentUser() user: { id: string; studentId: string },
    @Body() body: { endpoint: string },
  ) {
    return this.notificationService.unsubscribe(user.studentId, body.endpoint);
  }
}
