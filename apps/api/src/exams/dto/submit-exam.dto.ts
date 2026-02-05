/**
 * Submit Exam DTO
 *
 * Data transfer object for submitting an exam with questions and scoring.
 */

import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
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
  /**
   * Specific Juz this question belongs to
   */
  @ApiPropertyOptional({
    description: "Juz number for this specific question",
    example: 5,
  })
  @IsOptional()
  @IsInt()
  questionJuzNumber?: number;
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
   * Score for the current part (Gatekeeper)
   */
  @ApiPropertyOptional({
    description: "Score for the current part (0-100)",
    example: 85,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPartScore?: number;

  /**
   * Score for cumulative parts
   */
  @ApiPropertyOptional({
    description: "Score for cumulative parts (0-100)",
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cumulativeScore?: number;

  /**
   * Final weighted score
   */
  @ApiPropertyOptional({
    description: "Final weighted score (0-100)",
    example: 87.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  finalScore?: number;

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

  /**
   * Status of whether the student passed the exam
   */
  @ApiPropertyOptional({
    description: "Whether the student passed the exam",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  passed?: boolean;

  /**
   * Array of Juz/Part numbers tested in this exam (1-30)
   */
  @ApiPropertyOptional({
    description: "Array of Juz/Part numbers tested (1-30)",
    example: [1, 2],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(30, { each: true })
  testedParts?: number[];
}
