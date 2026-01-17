/**
 * Bulk Attendance DTO
 *
 * Data transfer object for updating multiple attendance records at once.
 */

import { Type } from "class-transformer";
import { IsArray, ValidateNested, ArrayMinSize } from "class-validator";
import { UpdateAttendanceDto } from "./update-attendance.dto";

export class BulkAttendanceDto {
  /**
   * Array of attendance updates
   */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateAttendanceDto)
  updates!: UpdateAttendanceDto[];
}
