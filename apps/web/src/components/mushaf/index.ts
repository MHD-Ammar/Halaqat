export { MushafPageRenderer } from "./MushafPageRenderer";
export type { WordPointerEvent } from "./MushafPageRenderer";
export { MushafPageHeader } from "./MushafPageHeader";
export { MushafAssessor } from "./MushafAssessor";
export { MistakeLegend } from "./MistakeLegend";
export { LiveScoreHeader } from "./LiveScoreHeader";
export { QualityOverridePicker } from "./QualityOverridePicker";
export { RadialMistakePicker } from "./RadialMistakePicker";
export { useRadialPicker } from "./use-radial-picker";
export { usePageSwipe } from "./use-page-swipe";
export {
  MISTAKE_STYLES,
  MISTAKE_TYPES_IN_ORDER,
  getMistakeStyle,
} from "./mistake-style";
export type { MistakeStyle } from "./mistake-style";

// ── New decomposed parts (Task-48) ────────────────────────────────────────
export { AssessorToolbar } from "./parts/AssessorToolbar";
export { PendingMistakesPanel } from "./parts/PendingMistakesPanel";
export { SaveBar } from "./parts/SaveBar";
export { SurahSearchSheet } from "./parts/SurahSearchSheet";
export { PageJumpInput } from "./parts/PageJumpInput";
export { usePendingMistakes } from "./hooks/usePendingMistakes";
export type { PendingMistake, UsePendingMistakesReturn } from "./hooks/usePendingMistakes";
export { useMushafKeyboard } from "./hooks/useMushafKeyboard";
