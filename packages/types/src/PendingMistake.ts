import { MistakeType } from "./MistakeType";

/**
 * Represents a single in-memory (not-yet-saved) word-level mistake recorded
 * by the teacher during a Mushaf assessment session.
 *
 * This type is shared between the web app (usePendingMistakes hook) and the
 * bulk-create DTO so that the shape stays consistent across both.
 */
export interface PendingMistake {
  wordLocation: string;
  pageNumber: number;
  surahNumber: number;
  ayahNumber: number;
  wordPosition: number;
  mistakeType: MistakeType;
  /** Display text of the word — cached for the pending-review list. */
  wordText: string;
}
