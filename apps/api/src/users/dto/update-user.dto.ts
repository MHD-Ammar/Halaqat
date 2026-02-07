/**
 * Update User DTO
 *
 * Data transfer object for admin user updates.
 * All fields are optional - only provided fields will be updated.
 */

import { UserRole } from "@halaqat/types";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  Matches,
} from "class-validator";

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: "User's full name",
    example: "Ahmed Mohammed",
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Full name must be at least 2 characters" })
  fullName?: string;

  @ApiPropertyOptional({
    description: "User email address",
    example: "teacher@halaqat.com",
  })
  @IsOptional()
  @IsEmail({}, { message: "Please provide a valid email address" })
  email?: string;

  @ApiPropertyOptional({
    description: "User phone number",
    example: "+966501234567",
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s()]+$/, { message: "Please enter a valid phone number" })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: "User role",
    enum: UserRole,
    example: "TEACHER",
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: "Invalid role. Must be ADMIN, TEACHER, SUPERVISOR, or EXAMINER",
  })
  role?: UserRole;
}
