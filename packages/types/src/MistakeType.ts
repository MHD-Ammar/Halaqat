/**
 * MistakeType Enum
 *
 * Categorizes recitation mistakes logged by the teacher.
 *
 * - MEMORIZATION: student forgot, skipped, substituted, or added a word/ayah.
 *   Treated as severe because it changes the actual content recited.
 * - TAJWEED: pronunciation or tajweed-rule violation (madd, ghunnah, qalqalah,
 *   etc.). Treated as light because it does not change meaning.
 * - TASHKEEL: incorrect harakat / vowel / case ending on a correct word.
 *   Treated as severe because in Quran a wrong vowel can change meaning
 *   (e.g., active vs. passive voice, subject vs. object).
 */
export enum MistakeType {
  /** Student forgot, skipped, substituted, or added a word */
  MEMORIZATION = "MEMORIZATION",
  /** Tajweed rule violation (e.g., wrong madd, missing ghunnah) */
  TAJWEED = "TAJWEED",
  /** Wrong harakat / vowel / case ending on an otherwise-correct word */
  TASHKEEL = "TASHKEEL",
}

/**
 * Runtime guard: narrow an unknown value to MistakeType.
 */
export function isMistakeType(value: unknown): value is MistakeType {
  return (
    typeof value === "string" &&
    (Object.values(MistakeType) as string[]).includes(value)
  );
}
