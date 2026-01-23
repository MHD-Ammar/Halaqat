/**
 * Update Role DTO
 */

import { IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@halaqat/types";

export class UpdateRoleDto {
  @ApiProperty({
    description: "New user role",
    enum: UserRole,
    example: "EXAMINER",
  })
  @IsEnum(UserRole, {
    message: "Invalid role",
  })
  role!: UserRole;
}
