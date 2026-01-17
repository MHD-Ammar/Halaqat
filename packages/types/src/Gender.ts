/**
 * Gender Enum
 *
 * Represents gender categories for study circles.
 * Used to segregate circles appropriately.
 */

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

/**
 * Type guard to check if a value is a valid Gender
 */
export function isGender(value: unknown): value is Gender {
  return (
    typeof value === "string" &&
    Object.values(Gender).includes(value as Gender)
  );
}
