import { UserRole } from "@halaqat/types";
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

import { AdminGamificationService } from "./admin-gamification.service";
import { Achievement } from "./entities/achievement.entity";
import { MilestoneReward } from "./entities/milestone-reward.entity";
import { LeagueService } from "./league.service";
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
}
