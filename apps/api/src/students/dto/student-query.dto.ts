/**
 * Student Query DTO
 *
 * Query parameters for filtering and pagination.
 */

import { IsOptional, IsString, IsUUID, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class StudentQueryDto {
  /**
   * Page number (1-indexed)
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Items per page (max 50)
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  /**
   * Search term for name (case-insensitive)
   */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Filter by circle ID
   */
  @IsOptional()
  @IsUUID()
  circleId?: string;
}
