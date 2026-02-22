/**
 * Update Role DTO
 */

import { UserRole } from "@halaqat/types";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

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
