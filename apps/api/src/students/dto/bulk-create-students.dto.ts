/**
 * Bulk Create Students DTO
 *
 * Data transfer object for bulk importing students.
 * Accepts a circle ID and array of student names.
 */

import { IsString, IsNotEmpty, IsUUID, IsArray, ArrayMinSize } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class BulkCreateStudentsDto {
  @ApiProperty({
    description: "UUID of the circle to assign students to",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  circleId!: string;

  @ApiProperty({
    description: "Array of student names to create",
    example: ["أحمد محمد", "علي عبدالله", "خالد سعد"],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: "At least one student name is required" })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  names!: string[];
}
