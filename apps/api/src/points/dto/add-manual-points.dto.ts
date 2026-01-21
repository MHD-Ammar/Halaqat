/**
 * Add Manual Points DTO
 *
 * Data transfer object for adding manual points with budget constraints.
 */

import { IsUUID, IsInt, IsString, IsNotEmpty, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AddManualPointsDto {
  @ApiProperty({
    description: "UUID of the student receiving points",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({
    description:
      "Point amount (positive for reward, negative for penalty). Range: -10 to +10",
    example: 5,
    minimum: -10,
    maximum: 10,
  })
  @IsInt()
  @Min(-10)
  @Max(10)
  amount!: number;

  @ApiProperty({
    description: "Reason for awarding/deducting points",
    example: "Excellent behavior during class",
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({
    description: "UUID of the session for budget tracking",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId!: string;
}
