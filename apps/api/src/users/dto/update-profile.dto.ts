/**
 * Update Profile DTO
 *
 * Data transfer object for updating user profile.
 */

import { IsString, MinLength, IsOptional } from "class-validator";

export class UpdateProfileDto {
  /**
   * User's full name
   */
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  @IsOptional()
  fullName?: string;

  /**
   * User's phone number
   */
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
