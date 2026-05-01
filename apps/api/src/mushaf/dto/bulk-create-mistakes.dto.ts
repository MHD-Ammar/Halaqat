/**
 * Bulk Create Mistakes DTO
 *
 * Used by the Teacher Assessor to save multiple word-level mistakes at once.
 */

import { MistakeType } from "@halaqat/types";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
  Matches,
} from "class-validator";

export class MistakeItemDto {
  @ApiProperty({
    description: 'Word location in "surah:ayah:wordPosition" format',
    example: "2:255:3",
  })
  @IsString()
  @Matches(/^\d+:\d+:\d+$/, {
    message: 'wordLocation must be in "surah:ayah:wordPosition" format (e.g., "2:255:3")',
  })
  wordLocation!: string;

  @ApiProperty({ description: "Mushaf page number (1-604)", example: 42 })
  @IsInt()
  @Min(1)
  @Max(604)
  pageNumber!: number;

  @ApiProperty({ description: "Surah number (1-114)", example: 2 })
  @IsInt()
  @Min(1)
  @Max(114)
  surahNumber!: number;

  @ApiProperty({ description: "Ayah number within the surah", example: 255 })
  @IsInt()
  @Min(1)
  ayahNumber!: number;

  @ApiProperty({ description: "Word position within the ayah (1-based)", example: 3 })
  @IsInt()
  @Min(1)
  wordPosition!: number;

  @ApiProperty({
    description: "Type of mistake",
    enum: MistakeType,
    example: "TAJWEED",
  })
  @IsEnum(MistakeType)
  mistakeType!: MistakeType;

  @ApiPropertyOptional({ description: "Optional teacher notes" })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class BulkCreateMistakesDto {
  @ApiPropertyOptional({ description: "UUID of the recitation this session belongs to" })
  @IsUUID()
  @IsOptional()
  recitationId?: string;

  @ApiProperty({ description: "UUID of the student" })
  @IsUUID()
  studentId!: string;

  @ApiProperty({
    description: "Array of mistake details",
    type: [MistakeItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MistakeItemDto)
  mistakes!: MistakeItemDto[];
}
