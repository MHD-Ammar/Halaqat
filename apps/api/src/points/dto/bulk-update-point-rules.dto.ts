/**
 * Bulk Update Point Rules DTO
 *
 * Data transfer object for updating multiple point rules at once.
 */

import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

class PointRuleUpdateItem {
  @ApiProperty({
    description: "Rule key to update",
    example: "RECITATION_PAGE",
  })
  @IsString()
  key!: string;

  @ApiProperty({
    description: "New point value",
    example: 10,
  })
  @IsInt()
  @Min(0)
  points!: number;
}

export class BulkUpdatePointRulesDto {
  @ApiProperty({
    description: "Array of point rules to update",
    type: [PointRuleUpdateItem],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PointRuleUpdateItem)
  rules!: PointRuleUpdateItem[];
}
