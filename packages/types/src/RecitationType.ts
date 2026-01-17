/**
 * Recitation Type Enum
 *
 * Type of Quran recitation - new memorization or review.
 */

export enum RecitationType {
  NEW_LESSON = "NEW_LESSON", // Hifz - new memorization
  REVIEW = "REVIEW",         // Mraja'a - review of previously memorized
}

/**
 * Type guard to check if a value is a valid RecitationType
 */
export function isRecitationType(value: unknown): value is RecitationType {
  return (
    typeof value === "string" &&
    Object.values(RecitationType).includes(value as RecitationType)
  );
}
