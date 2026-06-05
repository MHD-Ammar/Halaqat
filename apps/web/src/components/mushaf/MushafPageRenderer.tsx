"use client";

/**
 * MushafPageRenderer
 *
 * Renders a single page of the Quran with word-level interactivity.
 *
 * Layout strategy
 * ---------------
 * Words are grouped by `line_number`. Each line is laid out with
 * `flex-row + justify-between` so the whitespace between words is
 * distributed evenly across the line — this approximates the way the
 * Madinah Mushaf renders justified Arabic text, where each line ends at the
 * page margin regardless of how many words it contains.
 *
 * Font sizing per line is computed from the word count so that lines with
 * many words shrink, and lines with few words breathe — preventing the
 * "long word overflows the right margin on mobile" issue that plagued the
 * earlier renderer.
 *
 * Interactivity
 * -------------
 * The renderer is "interactivity agnostic": it accepts a single
 * `onWordPointerDown` callback and forwards the originating pointer event
 * along with the word. The owner (e.g. `MushafAssessor`) decides what to do
 * with it — typically, hand it off to {@link useRadialPicker} to start a
 * long-press + drag gesture.
 *
 * The `selectedWords` set drives the "currently pending" highlight; the
 * `highlightedWords` map drives the "already-saved mistake" highlight.
 * Both are passed by reference so re-renders are cheap.
 */

import type { MushafPage, MushafWord, MushafSurahMeta } from "@halaqat/types";
import { MistakeType } from "@halaqat/types";
import React, { useMemo } from "react";

import { cn } from "@/lib/utils";

import { getMistakeStyle } from "./mistake-style";

/**
 * Pointer-down event payload forwarded from the renderer to the owner.
 *
 * Keeps a clean boundary so we never leak React.PointerEvent references into
 * non-React code (e.g. tests or the gesture hook).
 */
export interface WordPointerEvent {
  word: MushafWord;
  pointerId: number;
  /** Viewport x of the pointer at the moment of pointerdown. */
  pointerX: number;
  /** Viewport y of the pointer at the moment of pointerdown. */
  pointerY: number;
  /**
   * Bounding-rect centre of the word element, in viewport coordinates.
   * Useful as the radial picker anchor — pinning to the word feels more
   * deliberate than pinning to the finger position.
   */
  anchorX: number;
  anchorY: number;
  /** The DOM element that received the event (for pointer capture). */
  element: Element;
}

/**
 * Map word counts on a line to a CSS font-size. Tuned empirically against
 * the Madinah Mushaf — lines with up to ~6 words can render at the largest
 * size; very dense lines (12+ words) need to shrink significantly to fit
 * mobile widths without horizontal overflow.
 */
function fontSizeForLine(wordCount: number): string {
  if (wordCount <= 5) return "clamp(1.25rem, 5.5vw, 2rem)";
  if (wordCount <= 7) return "clamp(1.1rem, 4.5vw, 1.85rem)";
  if (wordCount <= 9) return "clamp(1rem, 4vw, 1.65rem)";
  if (wordCount <= 11) return "clamp(0.95rem, 3.6vw, 1.5rem)";
  return "clamp(0.85rem, 3.2vw, 1.35rem)";
}

interface WordItemProps {
  word: MushafWord;
  interactive: boolean;
  mistake?: MistakeType;
  isSelected: boolean;
  onPointerDown?: (e: WordPointerEvent) => void;
}

/**
 * Memoised individual word — re-renders only when its own state changes,
 * which keeps interaction smooth on dense pages (~150–300 words).
 */
const WordItem = React.memo<WordItemProps>(
  ({ word, interactive, mistake, isSelected, onPointerDown }) => {
    const isEnd = word.char_type_name === "end";

    if (isEnd) {
      // Ayah end-marker — small ornamental circle around the ayah number.
      return (
        <span
          className="mushaf-ayah-end mx-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/5 font-sans text-[0.65em] text-primary"
          aria-label={`نهاية الآية ${word.text}`}
        >
          {word.text}
        </span>
      );
    }

    const style = mistake ? getMistakeStyle(mistake) : null;

    const handlePointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
      if (!interactive || !onPointerDown) return;
      // Only respond to the primary contact (mouse left button or first
      // touch). Pinch-zoom / two-finger gestures are intentionally ignored.
      if (e.pointerType === "mouse" && e.button !== 0) return;

      const rect = e.currentTarget.getBoundingClientRect();
      onPointerDown({
        word,
        pointerId: e.pointerId,
        pointerX: e.clientX,
        pointerY: e.clientY,
        anchorX: rect.left + rect.width / 2,
        anchorY: rect.top + rect.height / 2,
        element: e.currentTarget,
      });
    };

    return (
      <span
        onPointerDown={handlePointerDown}
        // Disable the browser's native context menu so a long-press on
        // touch devices does not pop the system magnifier / copy menu.
        onContextMenu={(e) => interactive && e.preventDefault()}
        className={cn(
          "mushaf-word relative inline-block rounded-md px-0.5 py-px transition-colors duration-150",
          "font-['Uthmanic']",
          interactive &&
            "cursor-pointer hover:bg-primary/10 active:bg-primary/15",
          // `touch-none` so the browser does not interpret the long-press
          // as a system gesture (text selection, callout, scroll).
          interactive && "touch-none select-none",
          style?.bgSoft,
          mistake && "border-b-2",
          style?.borderColor,
          isSelected &&
            "bg-indigo-500/20 outline outline-2 outline-indigo-500/70",
        )}
        data-location={word.location}
        data-mistake-type={mistake ?? undefined}
      >
        {word.text}
      </span>
    );
  },
);
WordItem.displayName = "WordItem";

interface MushafPageRendererProps {
  page: MushafPage;
  /** Map of saved mistakes for the current page → underline + tint. */
  highlightedWords?: Map<string, MistakeType>;
  /** Set of pending mistakes (in-memory) → indigo selection ring. */
  selectedWords?: ReadonlySet<string>;
  /** Whether to wire up pointer handlers. Off ⇒ pure read-only display. */
  interactive?: boolean;
  /** Called from each word's pointerdown when `interactive` is true. */
  onWordPointerDown?: (e: WordPointerEvent) => void;
  className?: string;
}

export const MushafPageRenderer = React.memo<MushafPageRendererProps>(
  ({
    page,
    highlightedWords,
    selectedWords,
    interactive = false,
    onWordPointerDown,
    className,
  }) => {
    /**
     * Group all words on the page by `line_number`. The Madinah Mushaf has
     * 15 lines per page (and the first page of each surah is shorter), so
     * the resulting array is small and cheap to compute on every page
     * change.
     */
    const groupedLines = useMemo(() => {
      const allWords = page.ayahs.flatMap((ayah) => ayah.words ?? []);
      const lineMap = new Map<number, MushafWord[]>();

      for (const word of allWords) {
        const existing = lineMap.get(word.line_number);
        if (existing) {
          existing.push(word);
        } else {
          lineMap.set(word.line_number, [word]);
        }
      }

      return Array.from(lineMap.entries()).sort(([a], [b]) => a - b);
    }, [page]);

    /**
     * Identify ayahs where a new surah begins so we can render a header
     * (surah name + bismillah) above that line. Keyed by `verse_key` so we
     * can match against the first word of each line cheaply.
     */
    const surahStartMap = useMemo(() => {
      const starts = new Map<string, MushafSurahMeta>();
      for (const ayah of page.ayahs) {
        if (ayah.numberInSurah === 1) {
          starts.set(`${ayah.surah.number}:1`, ayah.surah);
        }
      }
      return starts;
    }, [page]);

    const renderSurahHeader = (surah: MushafSurahMeta) => {
      const isAtTawbah = surah.number === 9;
      return (
        <div
          key={`surah-header-${surah.number}`}
          className="mb-6 mt-2 text-center"
        >
          <div className="mx-auto inline-flex h-14 max-w-md items-center justify-center rounded-md border-2 border-primary/30 bg-gradient-to-b from-primary/10 to-primary/5 px-8">
            <span className="font-['Uthmanic'] text-2xl font-bold text-primary">
              سورة {surah.name}
            </span>
          </div>
          {!isAtTawbah && (
            <div className="mt-3 font-['Uthmanic'] text-2xl text-foreground/80">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
          )}
        </div>
      );
    };

    return (
      <div
        className={cn(
          "mushaf-page mx-auto max-w-3xl select-none px-4 py-6",
          className,
        )}
        style={{ direction: "rtl" }}
      >
        {groupedLines.map(([lineNum, words]) => {
          // Surah header rendered above the line that holds the first ayah
          // of a new surah. We only render once per surah even if more than
          // one word matches (defensive: the first matching word wins).
          let header: React.ReactNode = null;
          for (const word of words) {
            if (word.position !== 1) continue;
            const startSurah = surahStartMap.get(word.verse_key);
            if (startSurah) {
              header = renderSurahHeader(startSurah);
              break;
            }
          }

          // Filter "end" markers out of the word count when picking a font
          // size — they are tiny and should not influence sizing.
          const realWordCount = words.filter(
            (w) => w.char_type_name === "word",
          ).length;

          return (
            <React.Fragment key={`line-${lineNum}`}>
              {header}
              <div
                className="mushaf-line flex flex-row items-center justify-between gap-x-1 leading-[2.6]"
                style={{ fontSize: fontSizeForLine(realWordCount) }}
              >
                {words.map((word, idx) => (
                  <WordItem
                    key={`${word.location}-${idx}`}
                    word={word}
                    interactive={interactive}
                    {...(highlightedWords?.has(word.location)
                      ? { mistake: highlightedWords.get(word.location) as MistakeType }
                      : {})}
                    isSelected={selectedWords?.has(word.location) ?? false}
                    {...(onWordPointerDown ? { onPointerDown: onWordPointerDown } : {})}
                  />
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  },
);
MushafPageRenderer.displayName = "MushafPageRenderer";
