/**
 * Exam question types for the Halaqat Quran Testing System.
 *
 * @description Defines the different types of questions in an exam.
 *
 * - CURRENT_PART: Questions about the current part being tested (3-5 questions, graded out of 100)
 * - CUMULATIVE: Questions from previous parts (1 question per previous part)
 */
export enum ExamQuestionType {
  /** Questions testing the current part being examined */
  CURRENT_PART = "CURRENT_PART",

  /** Questions from previous parts for cumulative review */
  CUMULATIVE = "CUMULATIVE",
}

/**
 * Type guard to check if a string is a valid ExamQuestionType
 *
 * @param value - The string value to check
 * @returns True if the value is a valid ExamQuestionType
 */
export function isExamQuestionType(value: string): value is ExamQuestionType {
  return Object.values(ExamQuestionType).includes(value as ExamQuestionType);
}
