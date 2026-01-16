/**
 * Auth Service
 *
 * Handles authentication logic including credential validation and JWT generation.
 */

import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { UsersService } from "../users/users.service";
import { User } from "../users/entities/user.entity";
import { JwtPayload } from "./interfaces/jwt-payload.interface";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials
   * @returns User without password if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<Omit<User, "password"> | null> {
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
   * Register a new user
   */
  async register(email: string, password: string, fullName: string): Promise<Omit<User, "password">> {
    const user = await this.usersService.create({ email, password, fullName });
    
    // Return user without password
    const { password: _, ...result } = user;
    return result;
  }
}
