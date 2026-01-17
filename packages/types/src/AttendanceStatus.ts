/**
 * Attendance Status Enum
 *
 * Status options for student attendance records.
 */

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  EXCUSED = "EXCUSED",
}

/**
 * Type guard to check if a value is a valid AttendanceStatus
 */
export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return (
    typeof value === "string" &&
    Object.values(AttendanceStatus).includes(value as AttendanceStatus)
  );
}
