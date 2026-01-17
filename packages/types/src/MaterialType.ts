/**
 * Material Type Enum
 *
 * Type of reference material in the curriculum.
 */

export enum MaterialType {
  QURAN = "QURAN",
  HADITH = "HADITH",
  OTHER = "OTHER",
}

/**
 * Type guard to check if a value is a valid MaterialType
 */
export function isMaterialType(value: unknown): value is MaterialType {
  return (
    typeof value === "string" &&
    Object.values(MaterialType).includes(value as MaterialType)
  );
}
