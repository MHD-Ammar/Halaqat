"use client";

/**
 * usePageSwipe
 *
 * Touch-based horizontal swipe-to-paginate hook. Built deliberately to
 * coexist with the radial picker:
 *
 * 1. A swipe may start anywhere — including on a word. The picker and the
 *    swipe are told apart by *intent*: the picker needs a stationary
 *    long-press, while a swipe is a fast horizontally-dominant flick. (The
 *    Mushaf's justified text leaves almost no gaps, so excluding word-touches
 *    would mean swipe never fires.)
 * 2. The hook ignores any gesture while a picker is active (passed in via
 *    `isBlocked`).
 * 3. Vertical drags are passed through so the page can scroll within
 *    itself — only horizontal swipes that exceed both an absolute and
 *    a directional threshold trigger a page change.
 *
 * The hook is returned as a small bag of `{ onTouchStart, onTouchEnd }`
 * handlers to be spread onto the swipe container. We deliberately do NOT
 * preventDefault inside touchmove — that would block the browser's native
 * scroll which the teacher expects within a page.
 */

import { useCallback, useRef } from "react";

/** Absolute horizontal distance (in CSS px) before a swipe is considered. */
const SWIPE_DISTANCE_THRESHOLD = 56;

/** Horizontal must exceed vertical by this ratio so a near-diagonal drag
 * (which the user usually means as scroll) does not flip pages. */
const HORIZONTAL_DOMINANCE = 1.4;

/**
 * Maximum gesture duration (ms) for a swipe. Anything slower is treated
 * as scrolling/holding rather than a flick. */
const MAX_SWIPE_MS = 750;

interface UsePageSwipeOptions {
  /** Called when the user swipes right-to-left (previous page). */
  onSwipePrev: () => void;
  /** Called when the user swipes left-to-right (next page). */
  onSwipeNext: () => void;
  /**
   * When true, the hook is dormant. Set this to `radial.state !== null` so
   * a swipe started during the picker is silently ignored.
   */
  isBlocked?: boolean;
}

interface SwipeStart {
  x: number;
  y: number;
  t: number;
}

/**
 * Swiping the finger from left to right moves the reader **forward**
 * (next page = higher page number); right-to-left moves backward. This
 * matches the product's chosen convention across the student and teacher
 * Mushaf surfaces.
 */
export function usePageSwipe({
  onSwipePrev,
  onSwipeNext,
  isBlocked,
}: UsePageSwipeOptions) {
  const startRef = useRef<SwipeStart | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Multi-touch (pinch) — leave to the browser.
      if (e.touches.length !== 1) {
        startRef.current = null;
        return;
      }
      if (isBlocked) {
        startRef.current = null;
        return;
      }

      // NOTE: we deliberately record the start position even when the touch
      // begins on a word. The Mushaf's justified text leaves almost no gap
      // between words, so excluding word-touches (the previous behaviour)
      // meant swipe-to-flip effectively never fired on the teacher assessor.
      //
      // This is safe because the two gestures are disambiguated by *intent*,
      // not by start target:
      //   - The radial picker needs a ~240ms stationary long-press; once it
      //     opens, `isBlocked` becomes true and the in-flight swipe below is
      //     discarded on touchend.
      //   - A swipe is a fast, horizontally-dominant flick — see the strict
      //     distance / dominance / duration checks in onTouchEnd.
      // A quick tap to mark a mistake moves <14px, so it fails the swipe
      // distance threshold and never flips the page.
      const t = e.touches[0];
      if (!t) return;
      startRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    },
    [isBlocked],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;
      if (isBlocked) return;
      if (e.changedTouches.length === 0) return;

      const t = e.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const elapsed = Date.now() - start.t;

      if (elapsed > MAX_SWIPE_MS) return;
      if (Math.abs(dx) < SWIPE_DISTANCE_THRESHOLD) return;
      if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_DOMINANCE) return;

      // Swipe left-to-right (positive dx) ⇒ NEXT page (higher number);
      // swipe right-to-left (negative dx) ⇒ PREVIOUS page. This matches the
      // student viewer and the teacher's expectation.
      if (dx > 0) onSwipeNext();
      else onSwipePrev();
    },
    [isBlocked, onSwipeNext, onSwipePrev],
  );

  return { onTouchStart, onTouchEnd };
}
