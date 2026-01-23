/**
 * Auth Service
 *
 * Handles authentication logic including credential validation,
 * JWT generation, and registration with invite code validation.
 */

import { Injectable, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { UsersService } from "../users/users.service";
import { MosquesService } from "../mosques/mosques.service";
import { User } from "../users/entities/user.entity";
import { JwtPayload } from "./interfaces/jwt-payload.interface";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mosquesService: MosquesService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials
   * @returns User without password if valid, null otherwise
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, "password"> | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // Return user without password
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Generate JWT access token for authenticated user
   */
  async login(user: Omit<User, "password">): Promise<{ accessToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  /**
   * Register a new user with invite code validation
   * @throws BadRequestException if invite code is invalid
   */
  async register(
    email: string,
    password: string,
    fullName: string,
    phoneNumber: string,
    inviteCode: string,
  ): Promise<Omit<User, "password">> {
    // Validate invite code and get mosque
    const mosque = await this.mosquesService.findByCode(inviteCode);

    if (!mosque) {
      throw new BadRequestException("Invalid invite code");
    }

    // Create user with mosqueId
    const user = await this.usersService.create({
      email,
      password,
      fullName,
      phoneNumber,
      mosqueId: mosque.id,
    });

    // Return user without password
    const { password: _, ...result } = user;
    return result;
  }
}
