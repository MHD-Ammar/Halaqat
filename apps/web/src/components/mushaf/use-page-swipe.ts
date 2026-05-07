"use client";

/**
 * usePageSwipe
 *
 * Touch-based horizontal swipe-to-paginate hook. Built deliberately to
 * coexist with the radial picker:
 *
 * 1. The hook ignores any gesture that originates inside `.mushaf-word`
 *    (or any element matching `excludeSelector`). The radial picker owns
 *    those gestures.
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
  /** Called when the user swipes from right-to-left (RTL: previous page). */
  onSwipePrev: () => void;
  /** Called when the user swipes from left-to-right (RTL: next page). */
  onSwipeNext: () => void;
  /**
   * When true, the hook is dormant. Set this to `radial.state !== null` so
   * a swipe started during the picker is silently ignored.
   */
  isBlocked?: boolean;
  /**
   * CSS selector for elements whose touchstart should be ignored by the
   * swipe layer. Defaults to mushaf words / ayah markers so the picker
   * owns those gestures end-to-end.
   */
  excludeSelector?: string;
}

interface SwipeStart {
  x: number;
  y: number;
  t: number;
}

/**
 * In Arabic / Mushaf reading, swiping the finger from right to left moves
 * the reader **forward** (next page = higher page number). Swiping from
 * left to right moves backward. The thresholds and signs below encode
 * exactly that mapping; if a future caller needs LTR semantics they can
 * pass swapped callbacks.
 */
export function usePageSwipe({
  onSwipePrev,
  onSwipeNext,
  isBlocked,
  excludeSelector = ".mushaf-word, .mushaf-ayah-end",
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
      // If the touch started on a word, the radial picker owns the gesture.
      const target = e.target as Element | null;
      if (target?.closest?.(excludeSelector)) {
        startRef.current = null;
        return;
      }

      const t = e.touches[0];
      if (!t) return;
      startRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    },
    [excludeSelector, isBlocked],
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

      // RTL semantics: positive dx (left-to-right swipe) ⇒ go BACK; negative
      // dx (right-to-left swipe) ⇒ go FORWARD. Matches how a physical
      // Mushaf is leafed.
      if (dx > 0) onSwipePrev();
      else onSwipeNext();
    },
    [isBlocked, onSwipeNext, onSwipePrev],
  );

  return { onTouchStart, onTouchEnd };
}
