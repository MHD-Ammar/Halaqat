/**
 * Update Mushaf State DTO
 *
 * Used to persist the student's current reading position.
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, Min, Max, IsOptional } from "class-validator";

export class UpdateMushafStateDto {
  @ApiProperty({
    description: "Madinah Mushaf page number (1-604)",
    example: 42,
    minimum: 1,
    maximum: 604,
  })
  @IsInt()
  @Min(1)
  @Max(604)
  pageNumber!: number;

  @ApiPropertyOptional({
    description: "Surah number (1-114)",
    example: 2,
  })
  @IsInt()
  @Min(1)
  @Max(114)
  @IsOptional()
  surahNumber?: number;

  @ApiPropertyOptional({
    description: "Ayah number within the surah",
    example: 255,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  ayahNumber?: number;
}
