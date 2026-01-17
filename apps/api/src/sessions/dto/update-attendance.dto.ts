/**
 * Update Attendance DTO
 *
 * Data transfer object for updating a single attendance record.
 */

import { IsUUID, IsEnum, IsNotEmpty } from "class-validator";
import { AttendanceStatus } from "@halaqat/types";

export class UpdateAttendanceDto {
  /**
   * ID of the student to update
   */
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  /**
   * New attendance status
   */
  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status!: AttendanceStatus;
}
