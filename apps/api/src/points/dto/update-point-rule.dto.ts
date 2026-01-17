/**
 * Update Point Rule DTO
 *
 * Data transfer object for updating a point rule's value.
 */

import { IsInt, IsOptional, IsBoolean, IsString } from "class-validator";

export class UpdatePointRuleDto {
  /**
   * New point value
   */
  @IsInt()
  @IsOptional()
  points?: number;

  /**
   * Whether the rule is active
   */
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /**
   * Updated description
   */
  @IsString()
  @IsOptional()
  description?: string;
}
