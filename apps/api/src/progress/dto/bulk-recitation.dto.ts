/**
 * Bulk Recitation DTO
 *
 * Data transfer object for recording multiple page recitations at once.
 */

import {
  IsUUID,
  IsInt,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";
import { RecitationType, RecitationQuality } from "@halaqat/types";

/**
 * Single page recitation detail
 */
export class PageRecitationDetail {
  /**
   * Madinah Mushaf page number (1-604)
   */
  @IsInt()
  @Min(1)
  @Max(604)
  pageNumber!: number;

  /**
   * Quality rating for this specific page
   */
  @IsEnum(RecitationQuality)
  quality!: RecitationQuality;

  /**
   * Type of recitation
   */
  @IsEnum(RecitationType)
  type!: RecitationType;
}

/**
 * Bulk recitation request for multiple pages
 */
export class BulkRecitationDto {
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
   * Array of page recitation details
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageRecitationDetail)
  @ArrayMinSize(1)
  details!: PageRecitationDetail[];
}
