"use client";

/**
 * usePendingMistakes
 *
 * Encapsulates all in-memory state for pending (not-yet-saved) Mushaf
 * mistakes. The caller never touches the raw state maps directly — it
 * interacts exclusively through the stable API returned here.
 *
 * Design notes:
 * - `selectedWordLocations` is a memoised `Set` so `MushafPageRenderer` can
 *   do O(1) selected-state lookups without referential churn.
 * - `toggleWord` uses the functional-update form of the setter so it never
 *   captures a stale closure over `pendingMistakesByPage`.
 * - `countOnPage` is a memoised lookup map, not an inline `.filter()` call
 *   on every render.
 */

import type { MistakeType, MushafWord, PendingMistake } from "@halaqat/types";
import { useCallback, useMemo, useState } from "react";

// Re-export so existing imports of PendingMistake from this file keep working.
export type { PendingMistake };

export interface UsePendingMistakesOptions {
  currentPage: number;
  savedWordLocations: ReadonlySet<string>;
}

export interface UsePendingMistakesReturn {
  /** All pending mistakes, keyed by page. */
  pendingMistakesByPage: Record<number, PendingMistake[]>;
  /** Pending for the *current* page — most consumers only need this. */
  pendingForPage: PendingMistake[];
  /** O(1) Set for the renderer's selection ring. */
  selectedWordLocations: ReadonlySet<string>;
  /** Total across all pages. */
  totalCount: number;
  /** Per-page count without filtering on each render. */
  countOnPage: (page: number) => number;

  /** Toggle a word mistake on/off (or switch type) for the current page. */
  toggleWord: (word: MushafWord, type: MistakeType, page: number) => void;
  /** Remove a specific mistake by word-location from any page. */
  removeByLocation: (location: string, page: number) => void;
  /** Undo the most recent mistake added to the current page. */
  undoLastOnPage: (page: number) => void;
  /** Clear all pending mistakes for a specific page. */
  clearPage: (page: number) => void;
  /** Reset everything after a successful save. */
  clearAll: () => void;
}

// ── Hook ───────────────────────────────────────────────────────────────────

function parseLocation(location: string) {
  const [surah = 0, ayah = 0, position = 0] = location.split(":").map(Number);
  return {
    surah: Number.isFinite(surah) ? surah : 0,
    ayah: Number.isFinite(ayah) ? ayah : 0,
    position: Number.isFinite(position) ? position : 0,
  };
}

export function usePendingMistakes({
  currentPage,
  savedWordLocations,
}: UsePendingMistakesOptions): UsePendingMistakesReturn {
  const [pendingMistakesByPage, setPendingMistakesByPage] = useState<
    Record<number, PendingMistake[]>
  >({});

  // ── Derived ──────────────────────────────────────────────────────────

  const pendingForPage = useMemo<PendingMistake[]>(
    () => pendingMistakesByPage[currentPage] ?? [],
    [pendingMistakesByPage, currentPage],
  );

  const selectedWordLocations = useMemo<ReadonlySet<string>>(
    () => new Set(pendingForPage.map((m) => m.wordLocation)),
    [pendingForPage],
  );

  const totalCount = useMemo(
    () =>
      Object.values(pendingMistakesByPage).reduce(
        (sum, arr) => sum + arr.length,
        0,
      ),
    [pendingMistakesByPage],
  );

  // Memoised per-page count map for O(1) lookups (e.g. page tab badges).
  const countByPage = useMemo<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    for (const [p, list] of Object.entries(pendingMistakesByPage)) {
      map[Number(p)] = list.length;
    }
    return map;
  }, [pendingMistakesByPage]);

  const countOnPage = useCallback(
    (page: number) => countByPage[page] ?? 0,
    [countByPage],
  );

  // ── Mutations ─────────────────────────────────────────────────────────

  const toggleWord = useCallback(
    (word: MushafWord, type: MistakeType, page: number) => {
      // Words already persisted are read-only from this surface.
      if (savedWordLocations.has(word.location)) return;
      if (word.char_type_name === "end") return;

      const { surah, ayah, position } = parseLocation(word.location);

      setPendingMistakesByPage((prev) => {
        const existing = prev[page] ?? [];
        const idx = existing.findIndex((m) => m.wordLocation === word.location);

        if (idx !== -1) {
          const cur = existing[idx];
          if (!cur) return prev;
          if (cur.mistakeType === type) {
            // Same type → deselect
            return { ...prev, [page]: existing.filter((_, i) => i !== idx) };
          }
          // Different type → replace
          const next = [...existing];
          next[idx] = { ...cur, mistakeType: type };
          return { ...prev, [page]: next };
        }

        return {
          ...prev,
          [page]: [
            ...existing,
            {
              wordLocation: word.location,
              pageNumber: page,
              surahNumber: surah,
              ayahNumber: ayah,
              wordPosition: position,
              mistakeType: type,
              wordText: word.text,
            },
          ],
        };
      });
    },
    [savedWordLocations],
  );

  const removeByLocation = useCallback((location: string, page: number) => {
    setPendingMistakesByPage((prev) => {
      const arr = prev[page] ?? [];
      const next = arr.filter((m) => m.wordLocation !== location);
      if (next.length === 0) {
        const copy = { ...prev };
        delete copy[page];
        return copy;
      }
      return { ...prev, [page]: next };
    });
  }, []);

  const undoLastOnPage = useCallback((page: number) => {
    setPendingMistakesByPage((prev) => {
      const cur = prev[page] ?? [];
      if (cur.length === 0) return prev;
      const next = cur.slice(0, -1);
      if (next.length === 0) {
        const copy = { ...prev };
        delete copy[page];
        return copy;
      }
      return { ...prev, [page]: next };
    });
  }, []);

  const clearPage = useCallback((page: number) => {
    setPendingMistakesByPage((prev) => {
      if (!(page in prev)) return prev;
      const copy = { ...prev };
      delete copy[page];
      return copy;
    });
  }, []);

  const clearAll = useCallback(() => {
    setPendingMistakesByPage({});
  }, []);

  return {
    pendingMistakesByPage,
    pendingForPage,
    selectedWordLocations,
    totalCount,
    countOnPage,
    toggleWord,
    removeByLocation,
    undoLastOnPage,
    clearPage,
    clearAll,
  };
}
