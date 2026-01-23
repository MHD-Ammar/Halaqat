/**
 * Users Service
 *
 * Handles user CRUD operations with secure password hashing.
 */

import { Injectable, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { UserRole } from "@halaqat/types";

import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Find a user by email address
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Find a user by their UUID
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Find user profile with relations (circles)
   */
  async findProfile(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ["circles"],
    });
  }

  /**
   * Create a new user with hashed password
   * @throws ConflictException if email already exists
   */
  async create(dto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException("Email already registered");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // Create and save user
    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      role: dto.role, // Defaults to TEACHER via entity
      mosqueId: dto.mosqueId ?? null,
    });

    return this.userRepository.save(user);
  }

  /**
   * Find all users with optional role filter
   * @param role - Optional role to filter by
   * @returns Array of users (without password)
   */
  async findAll(role?: string): Promise<User[]> {
    const query = this.userRepository
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.email",
        "user.fullName",
        "user.role",
        "user.createdAt",
      ])
      .orderBy("user.fullName", "ASC");

    if (role) {
      query.where("user.role = :role", { role });
    }

    return query.getMany();
  }

  /**
   * Update user role (Admin only)
   * @param userId - User ID
   * @param role - New role
   * @returns Updated user
   */
  async updateRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.role = role;
    return this.userRepository.save(user);
  }

  /**
   * Update user profile (name, phone)
   */
  async updateProfile(
    userId: string,
    updates: { fullName?: string; phoneNumber?: string },
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (updates.fullName) {
      user.fullName = updates.fullName;
    }
    if (updates.phoneNumber) {
      user.phoneNumber = updates.phoneNumber;
    }

    return this.userRepository.save(user);
  }

  /**
   * Change user password
   * @throws BadRequestException if current password is incorrect
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password and save
    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.userRepository.save(user);
  }
}
