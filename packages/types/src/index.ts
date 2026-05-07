/**
 * @halaqat/types
 *
 * Shared TypeScript types, DTOs, and interfaces for the Halaqat system.
 * This package provides type definitions used by both the API and Web applications.
 */

// Enums
export { UserRole, isUserRole } from "./UserRole";
export { Gender, isGender } from "./Gender";
export { MaterialType, isMaterialType } from "./MaterialType";
export { AttendanceStatus, isAttendanceStatus } from "./AttendanceStatus";
export { SessionStatus, isSessionStatus } from "./SessionStatus";
export { RecitationType, isRecitationType } from "./RecitationType";
export { RecitationQuality, isRecitationQuality } from "./RecitationQuality";
export { PointSourceType, isPointSourceType } from "./PointSourceType";
export { ExamStatus, isExamStatus } from "./ExamStatus";
export { ExamQuestionType, isExamQuestionType } from "./ExamQuestionType";
export { QuestFrequency } from "./QuestFrequency";
export { QuestCategory } from "./QuestCategory";
export { StoreItemType, isStoreItemType } from "./StoreItemType";

// Challenge Config
export {
  RAMADAN_FORM,
  CAMPAIGN_CONFIGS,
  CAMPAIGN_FORMS,
  getCampaignConfig,
  getCampaignForm,
} from "./ChallengeConfig";
export type {
  QuestionType,
  FormQuestion,
  QuestionScoringConfig,
  CampaignConfig,
} from "./ChallengeConfig";

// Mushaf
export { MistakeType, isMistakeType } from "./MistakeType";
export type {
  WordLocation,
  MushafWord,
  MushafSurahMeta,
  MushafAyah,
  MushafPage,
  StudentMushafStateDto,
  RecitationMistakeDto,
} from "./MushafTypes";
export {
  DEFAULT_SCORING_CONFIG,
  calculatePageScore,
  averagePageScores,
  tallyMistakes,
} from "./MushafScoring";
export type {
  ScoringConfig,
  PageScoreResult,
  MistakeCounts,
} from "./MushafScoring";
