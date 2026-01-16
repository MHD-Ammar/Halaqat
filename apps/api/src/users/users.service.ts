/**
 * Users Service
 *
 * Handles user CRUD operations with secure password hashing.
 */

import {
  Injectable,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

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
    });

    return this.userRepository.save(user);
  }
}
