/**
 * Auth Service
 *
 * Handles authentication logic including credential validation,
 * JWT generation, registration with invite code validation,
 * and student authentication.
 */

import { randomInt } from "crypto";

import { UserRole } from "@halaqat/types";
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { JwtPayload } from "./interfaces/jwt-payload.interface";
import { MosquesService } from "../mosques/mosques.service";
import { StudentsService } from "../students/students.service";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";

/**
 * Randomised delay (50–150 ms) applied on every failed credential check.
 *
 * BUG FIX: Previously, `validateUser` returned `null` immediately when the
 * username did not exist, but only after a bcrypt.compare() call when the
 * password was wrong.  The timing difference lets an attacker enumerate valid
 * email addresses via response-time analysis.  We now always run a dummy
 * bcrypt comparison when the user is not found so the response time is
 * indistinguishable between "unknown user" and "wrong password".
 */
const TIMING_JITTER_MS = { min: 50, max: 150 };

/**
 * A real bcrypt hash pre-computed at module load time.
 *
 * Using a fake/hardcoded hash string (previous approach) is unsafe because
 * bcrypt.compare() can short-circuit on malformed hashes, restoring the
 * timing difference we are trying to eliminate. A genuinely valid hash
 * ensures the full bcrypt work-factor is always exercised.
 *
 * Cost factor 10 matches the application's standard hashing cost.
 */
const DUMMY_HASH = bcrypt.hashSync("__halaqat_dummy_sentinel__", 10);

async function applyTimingJitter(): Promise<void> {
  const delay = randomInt(TIMING_JITTER_MS.min, TIMING_JITTER_MS.max);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mosquesService: MosquesService,
    private readonly studentsService: StudentsService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials.
   *
   * Security: Always performs a bcrypt comparison (against a dummy hash if the
   * user doesn't exist) to prevent user-enumeration via timing attacks.
   *
   * @returns User without password if valid, null otherwise
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, "password"> | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Constant-time dummy compare so response time is indistinguishable
      // from a real bcrypt compare, preventing user enumeration.
      await bcrypt.compare(password, DUMMY_HASH);
      await applyTimingJitter();
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await applyTimingJitter();
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
   * Authenticate a student by username and password.
   * Returns JWT and basic student info (XP, level, streak).
   */
  async studentLogin(
    username: string,
    password: string,
  ): Promise<{
    accessToken: string;
    student: {
      id: string;
      name: string;
      username: string;
      totalXp: number;
      currentLevel: number;
      currentStreak: number;
    };
  }> {
    // Find student by username, including passwordHash (select: false)
    const student = await this.studentsService
      .getRepository()
      .createQueryBuilder("student")
      .addSelect("student.passwordHash")
      .where("student.username = :username", { username })
      .getOne();

    if (!student || !student.passwordHash) {
      throw new UnauthorizedException("Invalid username or password");
    }

    // Verify password
    const isValid = await bcrypt.compare(password, student.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid username or password");
    }

    // Update lastLoginAt
    await this.studentsService
      .getRepository()
      .update(student.id, { lastLoginAt: new Date() });

    // Sign JWT
    const payload: JwtPayload = {
      sub: student.id,
      role: UserRole.STUDENT,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      student: {
        id: student.id,
        name: student.name,
        username: student.username ?? username,
        totalXp: student.totalXp,
        currentLevel: student.currentLevel,
        currentStreak: student.currentStreak,
      },
    };
  }

  /**
   * Register a new user with invite code validation
   * Returns accessToken for immediate login after registration
   * @throws BadRequestException if invite code is invalid
   */
  async register(
    email: string,
    password: string,
    fullName: string,
    phoneNumber: string,
    inviteCode: string,
  ): Promise<{ accessToken: string; user: Omit<User, "password"> }> {
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

    // Generate access token for immediate login
    const { accessToken } = await this.login(user);

    // Return user without password + accessToken
    const { password: _, ...userWithoutPassword } = user;
    return {
      accessToken,
      user: userWithoutPassword,
    };
  }
}
