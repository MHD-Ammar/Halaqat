/**
 * Update Mosque DTO
 *
 * Data transfer object for updating mosque information.
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class UpdateMosqueDto {
  @ApiProperty({
    description: "Name of the mosque",
    example: "مسجد النور",
  })
  @IsString()
  @IsNotEmpty({ message: "Mosque name is required" })
  @IsNotEmpty({ message: "Mosque name is required" })
  name!: string;

  @ApiProperty({
    description: "Weekly limit for manual points per teacher",
    example: 20,
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  manualPointLimit?: number;
}
