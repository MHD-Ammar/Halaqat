/**
 * Enum Aliases as `as const` Objects
 *
 * The canonical enum definitions live in their individual files
 * (UserRole.ts, MistakeType.ts, etc.) and are TypeScript enums.
 * This file re-exports them AND provides `as const` object aliases
 * under the same names so callers can:
 *
 *   - Use as a type:   `field: UserRole`
 *   - Use as a value:  `if (role === UserRole.ADMIN)`
 *   - Enumerate:       `Object.values(UserRole)` (works on both enums and const objects)
 *   - Autocomplete:    `UserRole.` → IDE lists all values
 *
 * Both the enum and the const alias are exported with the same name.
 * TypeScript merges the value (const object) with the type (typeof alias)
 * so callers see a single import that works in both positions.
 *
 * Usage:
 *   import { UserRole, MistakeType, AttendanceStatus } from "@halaqat/types";
 */

// Re-export the canonical enums so this file is a complete drop-in
export {
  UserRole,
  isUserRole,
} from "./UserRole";

export {
  MistakeType,
  isMistakeType,
} from "./MistakeType";

export {
  AttendanceStatus,
  isAttendanceStatus,
} from "./AttendanceStatus";

export {
  SessionStatus,
  isSessionStatus,
} from "./SessionStatus";

export {
  RecitationQuality,
  isRecitationQuality,
} from "./RecitationQuality";

export {
  RecitationType,
  isRecitationType,
} from "./RecitationType";

export {
  Gender,
  isGender,
} from "./Gender";

export {
  PointSourceType,
  isPointSourceType,
} from "./PointSourceType";

export {
  QuestCategory,
} from "./QuestCategory";

export {
  QuestFrequency,
} from "./QuestFrequency";

export {
  StoreItemType,
  isStoreItemType,
} from "./StoreItemType";

export {
  ExamStatus,
  isExamStatus,
} from "./ExamStatus";

export {
  ExamQuestionType,
  isExamQuestionType,
} from "./ExamQuestionType";
