/**
 * Create Point Rule DTO
 *
 * Data transfer object for creating custom reward rules.
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  ValidateIf,
} from "class-validator";

export class CreatePointRuleDto {
  @ApiProperty({
    description: "Human-readable label for the rule",
    example: "حفظ متن",
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: "Default point value for this rule",
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  points!: number;

  @ApiPropertyOptional({
    description: "Whether this rule appears in teacher's Quick Reward menu",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isVisibleToTeacher?: boolean;

  @ApiPropertyOptional({
    description: "If true, teacher enters points manually (variable input)",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isCustomEntry?: boolean;

  @ApiPropertyOptional({
    description: "Maximum points for custom entry rules (required if isCustomEntry is true)",
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @ValidateIf((o) => o.isCustomEntry === true)
  @IsInt()
  @Min(1)
  @Max(100)
  maxCustomValue?: number;
}
