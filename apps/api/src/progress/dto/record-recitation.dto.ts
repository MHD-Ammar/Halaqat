/**
 * Record Recitation DTO
 *
 * Data transfer object for recording a student's recitation.
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
import { RecitationType, RecitationQuality } from "@halaqat/types";

export class RecordRecitationDto {
  /**
   * ID of the student who recited
   */
  @IsUUID()
  studentId!: string;

  /**
   * ID of the session
   */
  @IsUUID()
  sessionId!: string;

  /**
   * ID of the Surah recited
   */
  @IsInt()
  @Min(1)
  @Max(114)
  surahId!: number;

  /**
   * Starting verse number
   */
  @IsInt()
  @Min(1)
  startVerse!: number;

  /**
   * Ending verse number
   */
  @IsInt()
  @Min(1)
  endVerse!: number;

  /**
   * Type of recitation
   */
  @IsEnum(RecitationType)
  type!: RecitationType;

  /**
   * Quality rating
   */
  @IsEnum(RecitationQuality)
  quality!: RecitationQuality;

  /**
   * Number of mistakes
   */
  @IsInt()
  @Min(0)
  @IsOptional()
  mistakesCount?: number;

  /**
   * Optional notes
   */
  @IsString()
  @IsOptional()
  notes?: string;
}
