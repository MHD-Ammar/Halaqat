/**
 * Create Circle DTO
 *
 * Data transfer object for creating a new circle.
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Gender } from "@halaqat/types";

export class CreateCircleDto {
  @ApiProperty({
    description: "Name of the Quran circle",
    example: "Morning Circle - Beginners",
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: "Optional description of the circle",
    example: "A circle for new students learning Juz Amma",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: "Physical location within the mosque",
    example: "Main Hall - Section A",
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: "Gender of students in this circle",
    enum: Gender,
    example: Gender.MALE,
  })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender!: Gender;

  @ApiPropertyOptional({
    description:
      "UUID of the teacher assigned to this circle. Required for admin, optional for teachers (defaults to self).",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsOptional()
  teacherId?: string;
}
