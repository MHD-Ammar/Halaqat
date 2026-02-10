/**
 * Award By Rule DTO
 *
 * Data transfer object for awarding points using a specific rule ID.
 * Supports both fixed-value and variable-input rules.
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsUUID,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
} from "class-validator";

export class AwardByRuleDto {
  @ApiProperty({
    description: "ID of the point rule to use",
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  ruleId!: number;

  @ApiProperty({
    description: "UUID of the student receiving points",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({
    description: "UUID of the session for budget tracking",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId!: string;

  @ApiPropertyOptional({
    description: "Custom point amount for variable-input rules (must be ≤ maxCustomValue)",
    example: 15,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  customAmount?: number;
}
