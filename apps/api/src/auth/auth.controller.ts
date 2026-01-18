/**
 * Auth Controller
 *
 * Handles authentication endpoints: register, login, profile, and admin-only test.
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { UserRole } from "@halaqat/types";

import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "./decorators/roles.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";

import { UsersService } from "../users/users.service";
import { UpdateProfileDto } from "../users/dto/update-profile.dto";
import { ChangePasswordDto } from "../users/dto/change-password.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Register a new user
   * POST /auth/register
   */
  @Post("register")
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(
      dto.email,
      dto.password,
      dto.fullName,
      dto.phoneNumber,
    );
    return {
      message: "User registered successfully",
      user,
    };
  }

  /**
   * Login with email and password
   * POST /auth/login
   */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.authService.login(user);
  }

  /**
   * Get current user profile (protected)
   * GET /auth/profile
   */
  @Get("profile")
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() currentUser: any) {
    const user = await this.usersService.findProfile(currentUser.id);
    return {
      message: "Profile retrieved successfully",
      user,
    };
  }

  /**
   * Update current user profile (name, phone)
   * PATCH /auth/profile
   */
  @Patch("profile")
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() currentUser: any,
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.usersService.updateProfile(currentUser.id, dto);
    return {
      message: "Profile updated successfully",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  /**
   * Change password (requires current password)
   * POST /auth/change-password
   */
  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() currentUser: any,
    @Body() dto: ChangePasswordDto,
  ) {
    try {
      await this.usersService.changePassword(
        currentUser.id,
        dto.currentPassword,
        dto.newPassword,
      );
      return {
        message: "Password changed successfully",
      };
    } catch (error) {
      if (error instanceof Error && error.message === "Current password is incorrect") {
        throw new BadRequestException("Current password is incorrect");
      }
      throw error;
    }
  }

  /**
   * Admin-only test endpoint (RBAC test)
   * GET /auth/admin-only
   */
  @Get("admin-only")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminOnly(@CurrentUser() user: any) {
    return {
      message: "Welcome, Admin!",
      user,
    };
  }
}
