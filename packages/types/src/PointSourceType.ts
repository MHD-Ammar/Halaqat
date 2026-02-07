/**
 * Point Source Type Enum
 *
 * Source/reason for a point transaction.
 */

export enum PointSourceType {
  RECITATION = "RECITATION",
  ATTENDANCE = "ATTENDANCE",
  EXAM = "EXAM",
  MANUAL_REWARD = "MANUAL_REWARD",
  MANUAL_PENALTY = "MANUAL_PENALTY",
}

/**
 * Type guard to check if a value is a valid PointSourceType
 */
export function isPointSourceType(value: unknown): value is PointSourceType {
  return (
    typeof value === "string" &&
    Object.values(PointSourceType).includes(value as PointSourceType)
  );
}
