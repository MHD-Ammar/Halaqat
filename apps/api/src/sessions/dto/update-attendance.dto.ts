/**
 * Update Attendance DTO
 *
 * Data transfer object for updating a single attendance record.
 */

import { IsUUID, IsEnum, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { AttendanceStatus } from "@halaqat/types";

export class UpdateAttendanceDto {
  @ApiProperty({
    description: "UUID of the student",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({
    description: "New attendance status",
    enum: AttendanceStatus,
    example: "PRESENT",
  })
  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status!: AttendanceStatus;
}
