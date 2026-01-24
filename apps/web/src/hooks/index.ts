/**
 * Hooks - Barrel Export
 */

export {
  useTodaySession,
  useUpdateAttendance,
  useSessionHistory,
  useStartSession,
} from "./use-today-session";
export { useUserProfile } from "./use-user-profile";
export { useSurahs, type Surah } from "./use-surahs";
export {
  useRecordRecitation,
  type BulkRecitationDto,
  type PageDetail,
} from "./use-record-recitation";
export { useAdminStats, type DailyOverview } from "./use-admin-stats";
export {
  useTeacherPerformance,
  type TeacherPerformance,
} from "./use-teacher-performance";
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
export { useTeachers, type Teacher } from "./use-teachers";
export {
  useCircle,
  type CircleDetails,
  type CircleStudent,
} from "./use-circle";
export { useCreateTeacher } from "./use-create-teacher";
export {
  useUnassignedStudents,
  type UnassignedStudent,
} from "./use-unassigned-students";
export { useAssignStudentToCircle } from "./use-assign-student-to-circle";
export { useTeacherStats, type TeacherStats } from "./use-teacher-stats";
export { useStudentPortal, type StudentPortalData } from "./use-student-portal";
export {
  useStudentExams,
  useExam,
  type Exam,
  type ExamQuestion,
  type StudentWithLastExam,
} from "./use-exams";
export { useUsers, useUpdateUserRole, type User } from "./use-users";
