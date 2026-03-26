/**
 * Teacher Quests Controller
 *
 * REST API endpoints for teacher-created circle-scoped quests.
 * All endpoints require JWT authentication and TEACHER role.
 *
 * Base route: /teacher/quests
 */

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
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

import { TeacherQuestsService } from "./teacher-quests.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Quest } from "../quests/entities/quest.entity";

@ApiTags("Teacher Quests")
@ApiBearerAuth("JWT-auth")
@Controller("teacher/quests")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
export class TeacherQuestsController {
  constructor(
    private readonly teacherQuestsService: TeacherQuestsService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List quests for teacher's circle" })
  async getQuests(@CurrentUser() user: { id: string }) {
    return this.teacherQuestsService.getQuests(user.id);
  }

  @Post()
  @ApiOperation({ summary: "Create a circle-scoped quest" })
  async createQuest(
    @CurrentUser() user: { id: string },
    @Body() dto: Partial<Quest>,
  ) {
    return this.teacherQuestsService.createQuest(user.id, dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a circle-scoped quest" })
  async updateQuest(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body() dto: Partial<Quest>,
  ) {
    return this.teacherQuestsService.updateQuest(user.id, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a circle-scoped quest" })
  async deleteQuest(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
  ) {
    return this.teacherQuestsService.deleteQuest(user.id, id);
  }
}
