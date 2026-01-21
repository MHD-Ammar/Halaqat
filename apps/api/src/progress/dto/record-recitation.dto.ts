/**
 * Record Recitation DTO
 *
 * Data transfer object for recording a single page recitation.
 */

import {
  IsUUID,
  IsInt,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RecitationType, RecitationQuality } from "@halaqat/types";

export class RecordRecitationDto {
  @ApiProperty({
    description: "UUID of the student who recited",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  studentId!: string;

  @ApiProperty({
    description: "UUID of the session",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID()
  sessionId!: string;

  @ApiProperty({
    description: "Madinah Mushaf page number (1-604)",
    example: 100,
    minimum: 1,
    maximum: 604,
  })
  @IsInt()
  @Min(1)
  @Max(604)
  pageNumber!: number;

  @ApiProperty({
    description: "Type of recitation",
    enum: RecitationType,
    example: "NEW",
  })
  @IsEnum(RecitationType)
  type!: RecitationType;

  @ApiProperty({
    description: "Quality rating of the recitation",
    enum: RecitationQuality,
    example: "EXCELLENT",
  })
  @IsEnum(RecitationQuality)
  quality!: RecitationQuality;

  @ApiPropertyOptional({
    description: "Number of mistakes made during recitation",
    example: 2,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  mistakesCount?: number;

  @ApiPropertyOptional({
    description: "Additional notes about the recitation",
    example: "Good tajweed, needs work on madd letters",
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
