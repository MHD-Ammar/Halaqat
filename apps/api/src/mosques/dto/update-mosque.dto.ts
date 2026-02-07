/**
 * Update Mosque DTO
 *
 * Data transfer object for updating mosque information.
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateMosqueDto {
  @ApiProperty({
    description: "Name of the mosque",
    example: "مسجد النور",
  })
  @IsString()
  @IsNotEmpty({ message: "Mosque name is required" })
  name!: string;
}
