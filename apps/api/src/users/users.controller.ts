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
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import { UserRole } from "@halaqat/types";

import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("users")
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all users with optional role filter (Admin only)
   * GET /api/users?role=TEACHER
   *
   * @param role - Optional role filter (ADMIN, TEACHER, SUPERVISOR)
   * @returns List of users matching the filter
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(@Query("role") role?: UserRole) {
    return this.usersService.findAll(role);
  }

  /**
   * Create a new user (Admin only)
   * POST /api/users
   *
   * @param createUserDto - User data (email, password, fullName, phoneNumber, role)
   * @returns The created user
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      message: "User created successfully",
      data: user,
    };
  }
}
