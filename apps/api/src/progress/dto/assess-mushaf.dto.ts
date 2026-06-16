/**
 * Assess Mushaf DTO
 *
 * Used by the Teacher Mushaf Assessor to record a recitation *and* its
 * word-level mistakes in a single atomic request.
 *
 * For every page the teacher touched we create one {@link Recitation} row
 * (so points / XP / milestones are awarded exactly like the page-range
 * recitation wizard) and persist the mistakes marked on that page, linked to
 * the freshly created recitation. The recitation's `mistakesCount` is derived
 * from the number of mistakes supplied for that page.
 *
 * This is what makes "recording from the Mushaf" produce the same student
 * achievement (إنجاز) and points as "recording from the recitation tab".
 */

import { RecitationType, RecitationQuality, MistakeType } from "@halaqat/types";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsUUID,
  IsInt,
  IsEnum,
  IsArray,
  ValidateNested,
  IsString,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
  Matches,
} from "class-validator";

/**
 * A single word-level mistake on a page.
 */
export class AssessMistakeDto {
  @ApiProperty({
    description: 'Word location in "surah:ayah:wordPosition" format',
    example: "2:255:3",
  })
  @IsString()
  @Matches(/^\d+:\d+:\d+$/, {
    message:
      'wordLocation must be in "surah:ayah:wordPosition" format (e.g., "2:255:3")',
  })
  wordLocation!: string;

  @ApiProperty({ description: "Surah number (1-114)", example: 2 })
  @IsInt()
  @Min(1)
  @Max(114)
  surahNumber!: number;

  @ApiProperty({ description: "Ayah number within the surah", example: 255 })
  @IsInt()
  @Min(1)
  ayahNumber!: number;

  @ApiProperty({ description: "Word position within the ayah (1-based)", example: 3 })
  @IsInt()
  @Min(1)
  wordPosition!: number;

  @ApiProperty({ description: "Type of mistake", enum: MistakeType, example: "TAJWEED" })
  @IsEnum(MistakeType)
  mistakeType!: MistakeType;

  @ApiPropertyOptional({ description: "Optional teacher notes" })
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * One page of the assessment: its quality + the mistakes marked on it.
 */
export class AssessPageDto {
  @ApiProperty({ description: "Madinah Mushaf page number (1-604)", example: 100 })
  @IsInt()
  @Min(1)
  @Max(604)
  pageNumber!: number;

  @ApiProperty({
    description: "Quality rating for this page (auto-suggested, teacher-editable)",
    enum: RecitationQuality,
    example: "VERY_GOOD",
  })
  @IsEnum(RecitationQuality)
  quality!: RecitationQuality;

  @ApiProperty({ description: "Type of recitation", enum: RecitationType, example: "REVIEW" })
  @IsEnum(RecitationType)
  type!: RecitationType;

  @ApiPropertyOptional({
    description: "Word-level mistakes marked on this page",
    type: [AssessMistakeDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AssessMistakeDto)
  mistakes?: AssessMistakeDto[];
}

/**
 * Full Mushaf assessment request.
 */
export class AssessMushafDto {
  @ApiProperty({ description: "UUID of the student who recited" })
  @IsUUID()
  studentId!: string;

  @ApiProperty({ description: "UUID of the session" })
  @IsUUID()
  sessionId!: string;

  @ApiProperty({
    description: "Pages assessed, each with its quality, type and mistakes",
    type: [AssessPageDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AssessPageDto)
  pages!: AssessPageDto[];
}
