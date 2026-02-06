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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { UserRole } from "@halaqat/types";

import { CirclesService } from "./circles.service";
import { CreateCircleDto } from "./dto/create-circle.dto";
import { UpdateCircleDto } from "./dto/update-circle.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Circles")
@ApiBearerAuth("JWT-auth")
@Controller("circles")
@UseInterceptors(ClassSerializerInterceptor)
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  /**
   * Create a new circle (Admin or Teacher)
   * POST /api/circles
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: "Create circle",
    description: "Create a new Quran study circle (Admin or Teacher)",
  })
  @ApiResponse({ status: 201, description: "Circle created successfully" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - requires ADMIN or TEACHER role",
  })
  create(
    @Body() createCircleDto: CreateCircleDto,
    @CurrentUser() user: { id: string; role: string; mosqueId?: string },
  ) {
    // If teacher is creating, force teacherId to be themselves
    if (user.role === UserRole.TEACHER) {
      createCircleDto.teacherId = user.id;
    }
    return this.circlesService.create(createCircleDto, user.mosqueId);
  }

  /**
   * Get all circles (Admin only)
   * GET /api/circles
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({
    summary: "List all circles",
    description: "Get all circles with their teachers (Admin only)",
  })
  @ApiResponse({ status: 200, description: "List of all circles" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  findAll(@CurrentUser() user: { id: string; mosqueId?: string }) {
    return this.circlesService.findAll(user.mosqueId);
  }

  /**
   * Get my assigned circles (Teacher)
   * GET /api/circles/my-list
   */
  @Get("my-list")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get my circles",
    description: "Get circles assigned to the current teacher",
  })
  @ApiResponse({ status: 200, description: "List of teacher's circles" })
  findMyCircles(@CurrentUser() user: { id: string }) {
    return this.circlesService.findMyCircles(user.id);
  }

  /**
   * Get a single circle by ID
   * GET /api/circles/:id
   */
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get circle by ID",
    description: "Get a single circle with its details",
  })
  @ApiParam({ name: "id", description: "Circle UUID" })
  @ApiResponse({ status: 200, description: "Circle details" })
  @ApiResponse({ status: 404, description: "Circle not found" })
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
  @ApiOperation({
    summary: "Update circle",
    description: "Update circle details (Admin only)",
  })
  @ApiParam({ name: "id", description: "Circle UUID" })
  @ApiResponse({ status: 200, description: "Circle updated successfully" })
  @ApiResponse({ status: 404, description: "Circle not found" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
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
  @ApiOperation({
    summary: "Delete circle",
    description: "Delete a circle (Admin only)",
  })
  @ApiParam({ name: "id", description: "Circle UUID" })
  @ApiResponse({ status: 200, description: "Circle deleted successfully" })
  @ApiResponse({ status: 404, description: "Circle not found" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.circlesService.remove(id);
  }
}
