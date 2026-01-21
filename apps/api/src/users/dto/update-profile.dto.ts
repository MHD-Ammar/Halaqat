/**
 * Update Profile DTO
 *
 * Data transfer object for updating user profile.
 */

import { IsString, MinLength, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: "User's full name (minimum 2 characters)",
    example: "Ahmed Mohammed",
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: "User's phone number",
    example: "+966501234567",
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
