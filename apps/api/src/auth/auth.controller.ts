/**
 * Auth Controller
 *
 * Handles authentication endpoints: register, login, profile, and admin-only test.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UnauthorizedException,
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

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  getProfile(@CurrentUser() user: any) {
    return {
      message: "Profile retrieved successfully",
      user,
    };
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
