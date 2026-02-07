/**
 * Users Controller
 *
 * REST API endpoints for managing users.
 * Provides user listing with optional role filtering.
 */

import { UserRole } from "@halaqat/types";
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  ApiParam,
} from "@nestjs/swagger";

import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

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
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
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
  findAll(
    @Query("role") role?: UserRole,
    @CurrentUser() user?: { mosqueId?: string },
  ) {
    return this.usersService.findAll(role, user?.mosqueId);
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
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() admin: { mosqueId?: string },
  ) {
    // Force mosqueId to admin's mosqueId if not provided or if admin is not super-admin
    if (admin.mosqueId) {
      createUserDto.mosqueId = admin.mosqueId;
    }

    const user = await this.usersService.create(createUserDto);
    return {
      message: "User created successfully",
      data: user,
    };
  }

  /**
   * Update user (Admin only)
   * PATCH /api/users/:id
   */
  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Update user",
    description: "Update user details (Admin only)",
  })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 409, description: "Email already in use" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      message: "User updated successfully",
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
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

  /**
   * Reset user password (Admin only)
   * PATCH /api/users/:id/reset-password
   */
  @Patch(":id/reset-password")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Reset user password",
    description: "Reset a user's password (Admin only)",
  })
  @ApiResponse({ status: 200, description: "Password reset successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  async resetPassword(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { password: string },
  ) {
    if (!body.password || body.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    await this.usersService.adminResetPassword(id, body.password);
    return {
      message: "Password reset successfully",
    };
  }

  /**
   * Delete user (Admin only)
   * DELETE /api/users/:id
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Delete user",
    description: "Permanently delete a user (Admin only)",
  })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.usersService.delete(id);
    return {
      message: "User deleted successfully",
    };
  }
}

