"use client";

/**
 * MushafPageRenderer Component
 *
 * Renders a single page of the Quran with word-level interactivity.
 * Supports mistake highlighting and right-to-left layout grouping by lines.
 * Optimized with React.memo and component extraction for high performance.
 */

import type { MushafPage, MushafWord, MushafSurahMeta } from "@halaqat/types";
import React, { useMemo } from "react";

import { cn } from "@/lib/utils";

/**
 * Sub-component for individual words to optimize rendering performance.
 * Only re-renders if word data, mistake status, or selection status changes.
 */
const WordItem = React.memo<{
  word: MushafWord;
  idx: number;
  interactive: boolean;
  mistake?: "MEMORIZATION" | "TAJWEED";
  isSelected: boolean;
  onWordTap?: (word: MushafWord) => void;
}>(({ word, idx, interactive, mistake, isSelected, onWordTap }) => {
  const isEnd = word.char_type_name === "end";

  if (isEnd) {
    return (
      <span
        key={`${word.location}-${idx}`}
        className="mushaf-ayah-end mx-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary/30 font-sans text-sm text-primary"
      >
        {word.text}
      </span>
    );
  }

  return (
    <span
      key={`${word.location}-${idx}`}
      onClick={() => interactive && onWordTap?.(word)}
      className={cn(
        "mushaf-word relative inline-block rounded px-1 transition-all duration-150",
        "font-['Uthmanic'] text-3xl leading-[2.8]",
        interactive && "cursor-pointer hover:bg-primary/10",
        mistake === "MEMORIZATION" && "bg-red-500/15 border-b-2 border-red-500",
        mistake === "TAJWEED" && "bg-amber-500/15 border-b-2 border-amber-500",
        isSelected && "selected bg-indigo-500/20 outline outline-2 outline-indigo-500 animate-pulse"
      )}
      data-location={word.location}
    >
      {word.text}
    </span>
  );
});

WordItem.displayName = "WordItem";

interface MushafPageRendererProps {
  page: MushafPage;
  highlightedWords?: Map<string, "MEMORIZATION" | "TAJWEED">;
  onWordTap?: (word: MushafWord) => void;
  selectedWords?: Set<string>;
  interactive?: boolean;
  className?: string;
}

export const MushafPageRenderer = React.memo(
  ({
    page,
    highlightedWords = new Map(),
    onWordTap,
    selectedWords = new Set(),
    interactive = false,
    className,
  }: MushafPageRendererProps) => {
    // 1. Group all words by line_number across all ayahs
    const groupedLines = useMemo(() => {
      const allWords = page.ayahs.flatMap((ayah) => ayah.words ?? []);
      const lineMap = new Map<number, MushafWord[]>();

      for (const word of allWords) {
        const existing = lineMap.get(word.line_number) || [];
        existing.push(word);
        lineMap.set(word.line_number, existing);
      }

      return Array.from(lineMap.entries()).sort(([a], [b]) => a - b);
    }, [page]);

    // 2. Identify ayahs where a new surah starts (numberInSurah === 1).
    // Key format: "surahNumber:1" matches word.verse_key (e.g., "2:1")
    const surahStartMap = useMemo(() => {
      const starts = new Map<string, MushafSurahMeta>();
      for (const ayah of page.ayahs) {
        if (ayah.numberInSurah === 1) {
          starts.set(`${ayah.surah.number}:1`, ayah.surah);
        }
      }
      return starts;
    }, [page]);

    /**
     * Helper to render Bismillah text
     */
    const renderSurahHeader = (surah: MushafSurahMeta) => {
      const isAtTawbah = surah.number === 9;

      return (
        <div key={`surah-header-${surah.number}`} className="mb-8 mt-4 text-center">
          <div className="mx-auto flex h-16 max-w-md items-center justify-center rounded-lg border-2 border-primary/20 bg-primary/5 px-8">
            <span className="font-['Uthmanic'] text-2xl font-bold text-primary">
               سورة {surah.name}
            </span>
          </div>
          {!isAtTawbah && (
            <div className="mt-4 font-['Uthmanic'] text-2xl text-foreground/80">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
          )}
        </div>
      );
    };

    return (
      <div
        className={cn(
          "mushaf-page mx-auto max-w-3xl select-none px-4 py-8 text-center",
          className
        )}
        style={{ direction: "rtl" }}
      >
        {groupedLines.map(([lineNum, words]) => {
          // Check if any word in this line starts a new surah.
          // verse_key is "surah:numberInSurah" (e.g., "2:1"), matching our map keys.
          const surahHeader = words
            .map((w) => {
              const startSurah = surahStartMap.get(w.verse_key);
              if (startSurah && w.position === 1) {
                return renderSurahHeader(startSurah);
              }
              return null;
            })
            .filter(Boolean);

          return (
            <React.Fragment key={`line-${lineNum}`}>
              {surahHeader}
              <div className="mushaf-line flex flex-nowrap justify-center gap-2 rtl:[direction:rtl]">
                {words.map((word, idx) => (
                  <WordItem
                    key={`${word.location}-${idx}`}
                    word={word}
                    idx={idx}
                    interactive={interactive}
                    mistake={highlightedWords.get(word.location)}
                    isSelected={selectedWords.has(word.location)}
                    onWordTap={onWordTap}
                  />
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }
);

MushafPageRenderer.displayName = "MushafPageRenderer";
