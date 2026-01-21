/**
 * Bulk Attendance DTO
 *
 * Data transfer object for updating multiple attendance records at once.
 */

import { Type } from "class-transformer";
import { IsArray, ValidateNested, ArrayMinSize } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UpdateAttendanceDto } from "./update-attendance.dto";

export class BulkAttendanceDto {
  @ApiProperty({
    description: "Array of attendance updates to apply",
    type: [UpdateAttendanceDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateAttendanceDto)
  updates!: UpdateAttendanceDto[];
}
