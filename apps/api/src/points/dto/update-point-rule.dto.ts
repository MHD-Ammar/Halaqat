/**
 * Update Point Rule DTO
 *
 * Data transfer object for updating a point rule's value.
 */

import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsBoolean, IsString } from "class-validator";

export class UpdatePointRuleDto {
  @ApiPropertyOptional({
    description: "New point value for this rule",
    example: 10,
  })
  @IsInt()
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({
    description: "Whether this rule is currently active",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: "Updated description for the rule",
    example: "Points awarded for excellent recitation",
  })
  @IsString()
  @IsOptional()
  description?: string;
}
