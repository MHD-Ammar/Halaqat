/**
 * Hooks - Barrel Export
 */

export { useTodaySession, useUpdateAttendance, useSessionHistory } from "./use-today-session";
export { useUserProfile } from "./use-user-profile";
export { useSurahs, type Surah } from "./use-surahs";
export { useRecordRecitation, type RecordRecitationDto } from "./use-record-recitation";
export { useAdminStats, type DailyOverview } from "./use-admin-stats";
export { useTeacherPerformance, type TeacherPerformance } from "./use-teacher-performance";
export {
  useStudentProfile,
  type StudentProfile,
  type Recitation,
  type PointTransaction,
  type AttendanceRecord,
} from "./use-student-profile";
export {
  useCircles,
  useMyCircles,
  useCreateCircle,
  useDeleteCircle,
  type Circle,
  type CreateCircleDto,
} from "./use-circles";
export {
  useStudents,
  useStudentsByCircle,
  useCreateStudent,
  useDeleteStudent,
  type Student,
  type CreateStudentDto,
  type PaginatedStudents,
} from "./use-students";
export { useAuth, type AuthUser, type UserRole } from "./use-auth";
