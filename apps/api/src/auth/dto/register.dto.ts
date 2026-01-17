/**
 * Register DTO
 */

import { IsEmail, IsString, MinLength, IsOptional, Matches } from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  email!: string;

  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  password!: string;

  @IsString()
  @MinLength(2, { message: "Full name must be at least 2 characters" })
  fullName!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s()]+$/, { message: "Please enter a valid phone number" })
  phoneNumber?: string;
}
