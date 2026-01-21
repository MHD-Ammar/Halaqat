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
import { ApiProperty } from "@nestjs/swagger";
import { RecitationType, RecitationQuality } from "@halaqat/types";

/**
 * Single page recitation detail
 */
export class PageRecitationDetail {
  @ApiProperty({
    description: "Madinah Mushaf page number (1-604)",
    example: 100,
    minimum: 1,
    maximum: 604,
  })
  @IsInt()
  @Min(1)
  @Max(604)
  pageNumber!: number;

  @ApiProperty({
    description: "Quality rating for this page",
    enum: RecitationQuality,
    example: "GOOD",
  })
  @IsEnum(RecitationQuality)
  quality!: RecitationQuality;

  @ApiProperty({
    description: "Type of recitation",
    enum: RecitationType,
    example: "REVIEW",
  })
  @IsEnum(RecitationType)
  type!: RecitationType;
}

/**
 * Bulk recitation request for multiple pages
 */
export class BulkRecitationDto {
  @ApiProperty({
    description: "UUID of the student who recited",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  studentId!: string;

  @ApiProperty({
    description: "UUID of the session",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID()
  sessionId!: string;

  @ApiProperty({
    description: "Array of page recitation details",
    type: [PageRecitationDetail],
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageRecitationDetail)
  @ArrayMinSize(1)
  details!: PageRecitationDetail[];
}
