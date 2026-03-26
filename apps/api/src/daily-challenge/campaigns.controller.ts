import { UserRole } from "@halaqat/types";
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

import { DailyChallengeService } from "./daily-challenge.service";
import { Campaign } from "./entities/campaign.entity";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@ApiTags("Admin Campaigns")
@Controller("admin/campaigns")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CampaignsController {
  constructor(private readonly challengeService: DailyChallengeService) {}

  @Post()
  @ApiOperation({ summary: "Create a new campaign (Admin)" })
  async createCampaign(@Body() dto: Partial<Campaign>) {
    return this.challengeService.createCampaign(dto);
  }

  @Get()
  @ApiOperation({ summary: "List all campaigns (Admin)" })
  async getCampaigns() {
    return this.challengeService.getCampaigns();
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a campaign (Admin)" })
  async updateCampaign(
    @Param("id") id: string,
    @Body() dto: Partial<Campaign>,
  ) {
    return this.challengeService.updateCampaign(id, dto);
  }
}
