import { UserRole } from "@halaqat/types";
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

import { AdminGamificationService } from "./admin-gamification.service";
import { CreateStoreItemDto, UpdateStoreItemDto } from "./dto/store-item.dto";
import { Achievement } from "./entities/achievement.entity";
import { MilestoneReward } from "./entities/milestone-reward.entity";
import { SeasonalEvent } from "./entities/seasonal-event.entity";
import { LeagueService } from "./league.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Quest } from "../quests/entities/quest.entity";

@ApiTags("Admin Gamification")
@Controller("gamification/admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminGamificationController {
  constructor(
    private readonly gamificationService: AdminGamificationService,
    private readonly leagueService: LeagueService,
  ) {}

  // --- Quests ---
  @Get("quests")
  @ApiOperation({ summary: "List all quests (Admin)" })
  async getQuests() {
    return this.gamificationService.getQuests();
  }

  @Post("quests")
  @ApiOperation({ summary: "Create a new quest (Admin)" })
  async createQuest(@Body() dto: Partial<Quest>) {
    return this.gamificationService.createQuest(dto);
  }

  @Put("quests/:id")
  @ApiOperation({ summary: "Update a quest (Admin)" })
  async updateQuest(@Param("id") id: string, @Body() dto: Partial<Quest>) {
    return this.gamificationService.updateQuest(id, dto);
  }

  @Delete("quests/:id")
  @ApiOperation({ summary: "Delete a quest (Admin)" })
  async deleteQuest(@Param("id") id: string) {
    return this.gamificationService.deleteQuest(id);
  }

  // --- Milestones ---
  @Get("milestones")
  @ApiOperation({ summary: "List all milestones (Admin)" })
  async getMilestones() {
    return this.gamificationService.getMilestones();
  }

  @Post("milestones")
  @ApiOperation({ summary: "Create a new milestone (Admin)" })
  async createMilestone(@Body() dto: Partial<MilestoneReward>) {
    return this.gamificationService.createMilestone(dto);
  }

  @Put("milestones/:id")
  @ApiOperation({ summary: "Update a milestone (Admin)" })
  async updateMilestone(
    @Param("id") id: string,
    @Body() dto: Partial<MilestoneReward>,
  ) {
    return this.gamificationService.updateMilestone(id, dto);
  }

  @Delete("milestones/:id")
  @ApiOperation({ summary: "Delete a milestone (Admin)" })
  async deleteMilestone(@Param("id") id: string) {
    return this.gamificationService.deleteMilestone(id);
  }

  // --- Achievements ---
  @Get("achievements")
  @ApiOperation({ summary: "List all achievements (Admin)" })
  async getAchievements() {
    return this.gamificationService.getAchievements();
  }

  @Post("achievements")
  @ApiOperation({ summary: "Create a new achievement (Admin)" })
  async createAchievement(@Body() dto: Partial<Achievement>) {
    return this.gamificationService.createAchievement(dto);
  }

  @Put("achievements/:id")
  @ApiOperation({ summary: "Update an achievement (Admin)" })
  async updateAchievement(
    @Param("id") id: string,
    @Body() dto: Partial<Achievement>,
  ) {
    return this.gamificationService.updateAchievement(id, dto);
  }

  @Delete("achievements/:id")
  @ApiOperation({ summary: "Delete an achievement (Admin)" })
  async deleteAchievement(@Param("id") id: string) {
    return this.gamificationService.deleteAchievement(id);
  }

  @Post("leagues/process-weekly-reset")
  @ApiOperation({ summary: "Process weekly league reset now (Admin)" })
  async processWeeklyLeagueReset() {
    return this.leagueService.processWeeklyReset();
  }

  // --- Store Items ---
  @Get("store-items")
  @ApiOperation({ summary: "List all store items (Admin)" })
  async getStoreItems() {
    return this.gamificationService.getStoreItems();
  }

  @Post("store-items")
  @ApiOperation({ summary: "Create a new store item (Admin)" })
  async createStoreItem(
    @CurrentUser() user: { mosqueId: string },
    @Body() dto: CreateStoreItemDto,
  ) {
    return this.gamificationService.createStoreItem(user.mosqueId, dto);
  }

  @Put("store-items/:id")
  @ApiOperation({ summary: "Update a store item (Admin)" })
  async updateStoreItem(
    @Param("id") id: string,
    @CurrentUser() user: { mosqueId: string },
    @Body() dto: UpdateStoreItemDto,
  ) {
    return this.gamificationService.updateStoreItem(id, user.mosqueId, dto);
  }

  @Delete("store-items/:id")
  @ApiOperation({ summary: "Delete a store item (Admin)" })
  async deleteStoreItem(@Param("id") id: string, @CurrentUser() user: { mosqueId: string }) {
    return this.gamificationService.deleteStoreItem(id, user.mosqueId);
  }

  @Post("store-items/:id/toggle")
  @ApiOperation({ summary: "Toggle store item active status (Admin)" })
  async toggleStoreItem(@Param("id") id: string, @CurrentUser() user: { mosqueId: string }) {
    return this.gamificationService.toggleStoreItem(id, user.mosqueId);
  }

  // --- Seasonal Events ---
  @Get("events")
  @ApiOperation({ summary: "List all seasonal events (Admin)" })
  async getEvents(@CurrentUser() user: { mosqueId: string }) {
    return this.gamificationService.getEvents(user.mosqueId);
  }

  @Post("events")
  @ApiOperation({ summary: "Create a new seasonal event (Admin)" })
  async createEvent(@CurrentUser() user: { mosqueId: string }, @Body() dto: Partial<SeasonalEvent>) {
    return this.gamificationService.createEvent(user.mosqueId, dto);
  }

  @Put("events/:id")
  @ApiOperation({ summary: "Update a seasonal event (Admin)" })
  async updateEvent(
    @Param("id") id: string,
    @CurrentUser() user: { mosqueId: string },
    @Body() dto: Partial<SeasonalEvent>,
  ) {
    return this.gamificationService.updateEvent(id, user.mosqueId, dto);
  }

  @Delete("events/:id")
  @ApiOperation({ summary: "Delete a seasonal event (Admin)" })
  async deleteEvent(@Param("id") id: string, @CurrentUser() user: { mosqueId: string }) {
    return this.gamificationService.deleteEvent(id, user.mosqueId);
  }

  @Get("events/:id/quests")
  @ApiOperation({ summary: "List all quests for an event (Admin)" })
  async getEventQuests(@Param("id") id: string) {
    return this.gamificationService.getEventQuests(id);
  }

  @Post("events/:id/quests")
  @ApiOperation({ summary: "Add a quest to an event (Admin)" })
  async addQuestToEvent(
    @Param("id") id: string,
    @Body() dto: { questId: string; bonusXp?: number },
  ) {
    return this.gamificationService.addQuestToEvent(id, dto.questId, dto.bonusXp);
  }

  @Delete("events/:eventId/quests/:questId")
  @ApiOperation({ summary: "Remove a quest from an event (Admin)" })
  async removeQuestFromEvent(
    @Param("eventId") eventId: string,
    @Param("questId") questId: string,
  ) {
    return this.gamificationService.removeQuestFromEvent(eventId, questId);
  }

  // --- Store Fulfillments ---
  @Get("pending-fulfillments")
  @ApiOperation({ summary: "List all pending store fulfillments (Admin)" })
  async getPendingFulfillments(@CurrentUser() user: { mosqueId: string }) {
    return this.gamificationService.getPendingFulfillments(user.mosqueId);
  }

  @Patch("fulfillments/:id")
  @ApiOperation({ summary: "Update store fulfillment status (Admin)" })
  async updateFulfillmentStatus(
    @Param("id") id: string,
    @CurrentUser() user: { mosqueId: string },
    @Body() dto: { status: "fulfilled" | "cancelled"; notes?: string },
  ) {
    return this.gamificationService.updateFulfillmentStatus(
      id,
      user.mosqueId,
      dto.status,
      dto.notes,
    );
  }
}
