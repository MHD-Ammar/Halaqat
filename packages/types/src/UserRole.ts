/**
 * User roles for the Halaqat Mosque Management System.
 *
 * @description Defines the different types of users that can access the system.
 * Each role has specific permissions and capabilities.
 *
 * - ADMIN: Full system access, can manage all aspects of the mosque
 * - TEACHER: Can manage Halaqat (study circles), students, and attendance
 * - SUPERVISOR: Can oversee teachers and Halaqat under their supervision
 */
export enum UserRole {
  /** Full administrative access to the entire system */
  ADMIN = "ADMIN",

  /** Teacher role for managing study circles and students */
  TEACHER = "TEACHER",

  /** Supervisor role for overseeing teachers and their Halaqat */
  SUPERVISOR = "SUPERVISOR",
}

/**
 * Type guard to check if a string is a valid UserRole
 *
 * @param value - The string value to check
 * @returns True if the value is a valid UserRole
 */
export function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}
