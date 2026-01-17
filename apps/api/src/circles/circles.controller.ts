/**
 * Circles Controller
 *
 * REST API endpoints for managing study circles.
 * Admin endpoints require ADMIN role.
 * Teacher endpoints require authentication only.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import { UserRole } from "@halaqat/types";

import { CirclesService } from "./circles.service";
import { CreateCircleDto } from "./dto/create-circle.dto";
import { UpdateCircleDto } from "./dto/update-circle.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("circles")
@UseInterceptors(ClassSerializerInterceptor)
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  /**
   * Create a new circle (Admin only)
   * POST /api/circles
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createCircleDto: CreateCircleDto) {
    return this.circlesService.create(createCircleDto);
  }

  /**
   * Get all circles (Admin only)
   * GET /api/circles
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.circlesService.findAll();
  }

  /**
   * Get my assigned circles (Teacher)
   * GET /api/circles/my-list
   */
  @Get("my-list")
  @UseGuards(JwtAuthGuard)
  findMyCircles(@CurrentUser() user: { sub: string }) {
    return this.circlesService.findMyCircles(user.sub);
  }

  /**
   * Get a single circle by ID
   * GET /api/circles/:id
   */
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.circlesService.findOne(id);
  }

  /**
   * Update a circle (Admin only)
   * PATCH /api/circles/:id
   */
  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateCircleDto: UpdateCircleDto,
  ) {
    return this.circlesService.update(id, updateCircleDto);
  }

  /**
   * Delete a circle (Admin only)
   * DELETE /api/circles/:id
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.circlesService.remove(id);
  }
}
