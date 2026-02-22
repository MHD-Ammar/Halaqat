/**
 * Update Profile DTO
 *
 * Data transfer object for updating user profile.
 */

import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, MinLength, IsOptional } from "class-validator";

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
