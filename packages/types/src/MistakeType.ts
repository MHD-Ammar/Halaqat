/**
 * MistakeType Enum
 *
 * Categorizes recitation mistakes logged by the teacher.
 * MEMORIZATION = student forgot or skipped a word/ayah
 * TAJWEED = pronunciation or tajweed rule violation
 */
export enum MistakeType {
  /** Student forgot, skipped, or substituted a word */
  MEMORIZATION = 'MEMORIZATION',
  /** Tajweed rule violation (e.g., wrong madd, missing ghunnah) */
  TAJWEED = 'TAJWEED',
}
