/**
 * Create User DTO
 */

import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  Matches,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "@halaqat/types";

export class CreateUserDto {
  @ApiProperty({
    description: "User email address",
    example: "teacher@halaqat.com",
  })
  @IsEmail({}, { message: "Please provide a valid email address" })
  email!: string;

  @ApiProperty({
    description: "User password (minimum 6 characters)",
    example: "password123",
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  password!: string;

  @ApiProperty({
    description: "User full name",
    example: "Ahmed Mohammed",
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: "Full name must be at least 2 characters" })
  fullName!: string;

  @ApiProperty({
    description: "User phone number",
    example: "+966501234567",
  })
  @IsString()
  @Matches(/^[0-9+\-\s()]+$/, { message: "Please enter a valid phone number" })
  phoneNumber!: string;

  @ApiPropertyOptional({
    description: "User role (defaults to TEACHER if not specified)",
    enum: UserRole,
    example: "TEACHER",
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: "Invalid role. Must be ADMIN, TEACHER, SUPERVISOR, or STUDENT",
  })
  role?: UserRole;
}
