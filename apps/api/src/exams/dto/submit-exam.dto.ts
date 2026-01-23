/**
 * Submit Exam DTO
 *
 * Data transfer object for submitting an exam with questions and scoring.
 */

import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ExamQuestionType } from "@halaqat/types";

/**
 * DTO for a single question submission
 */
export class ExamQuestionDto {
  /**
   * Type of question (CURRENT_PART or CUMULATIVE)
   */
  @ApiProperty({
    description: "Type of question",
    enum: ExamQuestionType,
    example: ExamQuestionType.CURRENT_PART,
  })
  @IsEnum(ExamQuestionType)
  type!: ExamQuestionType;

  /**
   * Optional question text (e.g., "Surah Al-Maida Verse 5")
   */
  @ApiPropertyOptional({
    description: "Question text or reference",
    example: "Surah Al-Maida Verse 5",
  })
  @IsOptional()
  @IsString()
  questionText?: string;

  /**
   * Number of mistakes made
   */
  @ApiProperty({
    description: "Number of mistakes made on this question",
    example: 2,
  })
  @IsInt()
  @Min(0)
  mistakesCount!: number;

  /**
   * Maximum possible score for this question
   */
  @ApiProperty({
    description: "Maximum score (weight) for this question",
    example: 20,
  })
  @IsInt()
  @Min(1)
  maxScore!: number;
}

/**
 * DTO for submitting a completed exam
 */
export class SubmitExamDto {
  /**
   * Array of questions with their scores
   */
  @ApiProperty({
    description: "Array of exam questions with mistakes and scores",
    type: [ExamQuestionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamQuestionDto)
  questions!: ExamQuestionDto[];

  /**
   * Optional score override (if not provided, auto-calculated)
   * Allows examiner to manually set final score
   */
  @ApiPropertyOptional({
    description:
      "Override final score (0-100). If not provided, auto-calculated using 0.5 points per mistake",
    example: 85,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;

  /**
   * Optional notes about the exam
   */
  @ApiPropertyOptional({
    description: "Notes about the exam submission",
    example: "Student showed good improvement",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
