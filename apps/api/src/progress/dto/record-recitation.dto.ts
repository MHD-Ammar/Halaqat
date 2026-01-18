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
   * Madinah Mushaf page number (1-604)
   */
  @IsInt()
  @Min(1)
  @Max(604)
  pageNumber!: number;

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
   * Number of mistakes (optional)
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
