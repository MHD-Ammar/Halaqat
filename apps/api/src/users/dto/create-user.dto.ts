/**
 * Create User DTO
 */

import { IsEmail, IsString, MinLength, IsOptional, IsEnum, Matches } from "class-validator";
import { UserRole } from "@halaqat/types";

export class CreateUserDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  email!: string;

  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  password!: string;

  @IsString()
  @MinLength(2, { message: "Full name must be at least 2 characters" })
  fullName!: string;

  @IsString()
  @Matches(/^[0-9+\-\s()]+$/, { message: "Please enter a valid phone number" })
  phoneNumber!: string;

  @IsOptional()
  @IsEnum(UserRole, { message: "Invalid role. Must be ADMIN, TEACHER, or SUPERVISOR" })
  role?: UserRole;
}
