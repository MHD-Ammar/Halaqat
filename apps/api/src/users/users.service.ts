/**
 * Users Service
 *
 * Handles user CRUD operations with secure password hashing.
 */

import { UserRole } from "@halaqat/types";
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository, Not } from "typeorm";

import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";

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
      relations: ["circles", "mosque"],
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
   * Find all users with optional role and mosque filter
   * @param role - Optional role to filter by
   * @param mosqueId - Optional mosque ID to filter by
   * @returns Array of users (without password)
   */
  async findAll(role?: string, mosqueId?: string): Promise<User[]> {
    const query = this.userRepository
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.email",
        "user.fullName",
        "user.phoneNumber",
        "user.role",
        "user.createdAt",
        "user.mosqueId",
      ])
      .orderBy("user.fullName", "ASC");

    if (role) {
      query.andWhere("user.role = :role", { role });
    }

    if (mosqueId) {
      query.andWhere("user.mosqueId = :mosqueId", { mosqueId });
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
      throw new NotFoundException("User not found");
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
      throw new NotFoundException("User not found");
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
      throw new NotFoundException("User not found");
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

  /**
   * Reset user password (Admin only)
   * Does not require current password
   */
  async adminResetPassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.userRepository.save(user);
  }

  /**
   * Update user (Admin only)
   * Updates fullName, email, phoneNumber, and/or role
   * @throws NotFoundException if user not found
   * @throws ConflictException if email already taken by another user
   */
  async update(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check email uniqueness if updating email
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.email, id: Not(userId) },
      });
      if (existingUser) {
        throw new ConflictException("Email already in use");
      }
      user.email = dto.email;
    }

    // Update other fields if provided
    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.phoneNumber) user.phoneNumber = dto.phoneNumber;
    if (dto.role) user.role = dto.role;

    return this.userRepository.save(user);
  }

  /**
   * Delete user (Admin only)
   * @throws NotFoundException if user not found
   */
  async delete(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.userRepository.remove(user);
  }
}

