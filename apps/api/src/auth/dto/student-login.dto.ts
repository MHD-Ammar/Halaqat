/**
 * Student Login DTO
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class StudentLoginDto {
  @ApiProperty({
    description: "Student username",
    example: "ahmad4829",
  })
  @IsString()
  username!: string;

  @ApiProperty({
    description: "Student password (6 characters)",
    example: "X7mP2n",
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  password!: string;
}
