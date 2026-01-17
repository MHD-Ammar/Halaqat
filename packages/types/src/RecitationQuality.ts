/**
 * Recitation Quality Enum
 *
 * Quality rating for student recitation.
 */

export enum RecitationQuality {
  EXCELLENT = "EXCELLENT",
  VERY_GOOD = "VERY_GOOD",
  GOOD = "GOOD",
  ACCEPTABLE = "ACCEPTABLE",
  POOR = "POOR",
}

/**
 * Type guard to check if a value is a valid RecitationQuality
 */
export function isRecitationQuality(value: unknown): value is RecitationQuality {
  return (
    typeof value === "string" &&
    Object.values(RecitationQuality).includes(value as RecitationQuality)
  );
}
