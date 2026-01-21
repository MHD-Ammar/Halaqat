/**
 * Student Query DTO
 *
 * Query parameters for filtering and pagination.
 */

import { IsOptional, IsString, IsUUID, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class StudentQueryDto {
  @ApiPropertyOptional({
    description: "Page number (1-indexed)",
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of items per page (max 50)",
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: "Search term for filtering by name (case-insensitive)",
    example: "Omar",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Filter by circle UUID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID()
  circleId?: string;
}
