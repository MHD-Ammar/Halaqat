/**
 * Change Password DTO
 *
 * Data transfer object for changing user password.
 */

import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ChangePasswordDto {
  @ApiProperty({
    description: "Current password for verification",
    example: "oldpassword123",
  })
  @IsString()
  currentPassword!: string;

  @ApiProperty({
    description: "New password (minimum 6 characters)",
    example: "newpassword456",
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: "New password must be at least 6 characters" })
  newPassword!: string;
}
