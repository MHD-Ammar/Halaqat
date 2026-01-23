/**
 * Exam status for the Halaqat Quran Testing System.
 *
 * @description Defines the different states an exam can be in.
 *
 * - PENDING: Exam has been started but not yet completed
 * - COMPLETED: Exam has been submitted with all questions graded
 */
export enum ExamStatus {
  /** Exam is in progress, not yet submitted */
  PENDING = "PENDING",

  /** Exam has been completed and graded */
  COMPLETED = "COMPLETED",
}

/**
 * Type guard to check if a string is a valid ExamStatus
 *
 * @param value - The string value to check
 * @returns True if the value is a valid ExamStatus
 */
export function isExamStatus(value: string): value is ExamStatus {
  return Object.values(ExamStatus).includes(value as ExamStatus);
}
