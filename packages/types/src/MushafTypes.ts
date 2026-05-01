/**
 * Mushaf Data Types
 *
 * TypeScript interfaces matching the QuraniHub API response shapes.
 * Used by both the frontend QuraniService and any backend processing.
 */

/**
 * Word location string format: "surah:ayah:wordPosition"
 * Example: "2:255:3" = Surah Al-Baqarah, Ayah 255, 3rd word
 */
export type WordLocation = string;

/**
 * A single word within an ayah, as returned by QuraniHub
 */
export interface MushafWord {
  /** The Arabic text of the word (Uthmani script) */
  text: string;
  /** Whether this is a "word" or "end" (ayah marker) */
  char_type_name: 'word' | 'end';
  /** 1-based position of the word within the ayah */
  position: number;
  /** Line number on the Mushaf page (for layout) */
  line_number: number;
  /** Verse key in "surah:ayah" format */
  verse_key: string;
  /** Full word location in "surah:ayah:position" format */
  location: WordLocation;
  /** The page number this word appears on */
  page_number: number;
}

/**
 * Surah metadata within a page response
 */
export interface MushafSurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: 'Meccan' | 'Medinan';
  numberOfAyahs: number;
}

/**
 * A single ayah within a page response
 */
export interface MushafAyah {
  /** Global ayah number (1-6236) */
  number: number;
  /** Full ayah text (Uthmani script) */
  text: string;
  /** Surah metadata */
  surah: MushafSurahMeta;
  /** Ayah number within the surah */
  numberInSurah: number;
  /** Juz number */
  juz: number;
  /** Page number */
  page: number;
  /** Ruku number */
  ruku: number;
  /** Hizb quarter */
  hizbQuarter: number;
  /** Whether this ayah has a sajda */
  sajda: boolean;
  /** Word-level data (only present when ?words=true) */
  words?: MushafWord[];
}

/**
 * A full Mushaf page response from QuraniHub
 */
export interface MushafPage {
  /** Page number (1-604) */
  number: number;
  /** Surah info at the top of the page */
  topPageSurah: MushafSurahMeta;
  /** Juz number at the top of the page */
  topPageJuz: number;
  /** Hizb numbers on this page */
  hizbNumbers: number[];
  /** All ayahs on this page */
  ayahs: MushafAyah[];
  /** All surahs that appear on this page */
  surahs: MushafSurahMeta[];
}

/**
 * Student's persisted Mushaf reading state
 */
export interface StudentMushafStateDto {
  /** Last page the student was reading (1-604) */
  lastPageNumber: number;
  /** Last surah number (optional) */
  lastSurahNumber?: number | null;
  /** Last ayah number (optional) */
  lastAyahNumber?: number | null;
}

/**
 * A single recitation mistake logged by the teacher
 */
export interface RecitationMistakeDto {
  /** Word location in "surah:ayah:position" format */
  wordLocation: WordLocation;
  /** Mushaf page number */
  pageNumber: number;
  /** Surah number */
  surahNumber: number;
  /** Ayah number within the surah */
  ayahNumber: number;
  /** Word position within the ayah */
  wordPosition: number;
  /** Type of mistake */
  mistakeType: 'MEMORIZATION' | 'TAJWEED';
  /** Optional teacher notes */
  notes?: string;
}
