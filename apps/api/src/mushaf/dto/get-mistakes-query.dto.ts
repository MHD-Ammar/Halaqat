/**
 * Get Mistakes Query DTO
 *
 * Optional filters for fetching student mistakes.
 */

import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Min, Max } from "class-validator";

export class GetMistakesQueryDto {
  @ApiPropertyOptional({
    description: "Filter by page number (1-604)",
    example: 42,
  })
  @IsInt()
  @Min(1)
  @Max(604)
  @IsOptional()
  @Type(() => Number)
  pageNumber?: number;

  @ApiPropertyOptional({
    description: "Filter by surah number (1-114)",
    example: 2,
  })
  @IsInt()
  @Min(1)
  @Max(114)
  @IsOptional()
  @Type(() => Number)
  surahNumber?: number;

  @ApiPropertyOptional({
    description:
      "When true, return only the mistakes from the most recent recitation attempt on the filtered page (ignored without pageNumber).",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  latestOnly?: boolean;
}
