/**
 * Users Controller
 *
 * REST API endpoints for managing users.
 * Provides user listing with optional role filtering.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { UserRole } from "@halaqat/types";

import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@Controller("users")
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all users with optional role filter (Admin only)
   * GET /api/users?role=TEACHER
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "List users",
    description: "Get all users with optional role filter (Admin only)",
  })
  @ApiQuery({
    name: "role",
    required: false,
    enum: UserRole,
    description: "Filter by role",
  })
  @ApiResponse({ status: 200, description: "List of users" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  findAll(@Query("role") role?: UserRole) {
    return this.usersService.findAll(role);
  }

  /**
   * Create a new user (Admin only)
   * POST /api/users
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Create user",
    description: "Create a new user (Admin only)",
  })
  @ApiResponse({ status: 201, description: "User created successfully" })
  @ApiResponse({ status: 400, description: "Validation error or email exists" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      message: "User created successfully",
      data: user,
    };
  }

  /**
   * Update user role (Admin only)
   * PATCH /api/users/:id/role
   */
  @Patch(":id/role")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Update user role",
    description: "Change a user's role (Admin only)",
  })
  @ApiResponse({ status: 200, description: "Role updated successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  async updateRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const user = await this.usersService.updateRole(id, dto.role);
    return {
      message: "Role updated successfully",
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
