/**
 * Change Password DTO
 *
 * Data transfer object for changing user password.
 */

import { IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  /**
   * Current password for verification
   */
  @IsString()
  currentPassword!: string;

  /**
   * New password (min 6 characters)
   */
  @IsString()
  @MinLength(6, { message: "New password must be at least 6 characters" })
  newPassword!: string;
}
