/**
 * Register DTO
 */

import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsNotEmpty,
  Length,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({
    description: "User email address",
    example: "newuser@halaqat.com",
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

  @ApiProperty({
    description: "Mosque invite code (exactly 6 characters)",
    example: "111111",
  })
  @IsString()
  @IsNotEmpty({ message: "Invite code is required" })
  @Length(6, 6, { message: "Invite code must be exactly 6 characters" })
  inviteCode!: string;
}
