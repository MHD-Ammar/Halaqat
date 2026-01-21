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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
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

@ApiTags("Auth")
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
  @ApiOperation({
    summary: "Register new user",
    description: "Create a new user account",
  })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({
    status: 400,
    description: "Validation error or email already exists",
  })
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
  @ApiOperation({
    summary: "User login",
    description: "Authenticate with email and password",
  })
  @ApiResponse({
    status: 200,
    description: "Login successful, returns JWT token",
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
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
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get user profile",
    description: "Get current authenticated user's profile",
  })
  @ApiResponse({ status: 200, description: "Profile retrieved successfully" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid or missing token",
  })
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
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Update profile",
    description: "Update current user's name and phone",
  })
  @ApiResponse({ status: 200, description: "Profile updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
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
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Change password",
    description: "Change password with current password verification",
  })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  @ApiResponse({ status: 400, description: "Current password is incorrect" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
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
      if (
        error instanceof Error &&
        error.message === "Current password is incorrect"
      ) {
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
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Admin test endpoint",
    description: "Test endpoint for ADMIN role verification",
  })
  @ApiResponse({ status: 200, description: "Admin access confirmed" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  adminOnly(@CurrentUser() user: any) {
    return {
      message: "Welcome, Admin!",
      user,
    };
  }
}
