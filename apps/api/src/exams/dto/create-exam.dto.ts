/**
 * Create Exam DTO
 *
 * Data transfer object for starting a new exam session.
 */

import { IsUUID, IsDateString, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateExamDto {
  /**
   * ID of the student being tested
   */
  @ApiProperty({
    description: "UUID of the student being tested",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  studentId!: string;

  /**
   * Date of the exam (defaults to current date if not provided)
   */
  @ApiPropertyOptional({
    description: "Date of the exam (ISO format)",
    example: "2026-01-23",
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  /**
   * Optional notes about the exam
   */
  @ApiPropertyOptional({
    description: "Optional notes about the exam",
    example: "Testing Juz 30",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
