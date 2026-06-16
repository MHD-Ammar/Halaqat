"use client";

/**
 * useRadialPicker
 *
 * Headless gesture hook that powers the long-press + drag-to-select radial
 * mistake picker. The hook is intentionally decoupled from rendering so the
 * same gesture machine can be re-used (e.g. for a future quality picker).
 *
 * Gesture state machine (per pointer):
 *
 *   IDLE
 *     │  pointerdown on a word
 *     ▼
 *   PRESSING ─── pointer moves > MOVE_TOLERANCE_PX ──▶ CANCELLED (treat as scroll)
 *     │  long-press timer fires (LONG_PRESS_MS)
 *     ▼
 *   PICKING ──── pointermove ─── update activeIndex
 *     │
 *     │  pointerup
 *     ▼
 *   SELECTED (fires onSelect if activeIndex >= 0)
 *
 * Important details handled here:
 *
 * - **Pointer capture**: once long-press fires we set pointer capture on the
 *   anchoring element so `pointermove` keeps flowing even if the finger
 *   leaves the original word.
 * - **Tap fallback**: a quick release before the long-press fires is exposed
 *   as `onQuickTap` so the caller can implement a "single-tap = current
 *   default mode" behaviour.
 * - **Scroll discrimination**: any movement beyond `MOVE_TOLERANCE_PX`
 *   *before* the long-press fires cancels the gesture, leaving the page
 *   free to scroll. After the long-press fires, movement is consumed.
 * - **Haptics**: a short navigator.vibrate pulse on the long-press boundary
 *   makes the gesture feel physical on mobile (no-op where unsupported).
 */

import { useCallback, useEffect, useRef, useState } from "react";

const LONG_PRESS_MS = 300;
const MOVE_TOLERANCE_PX = 8;
const HAPTIC_PULSE_MS = 12;

/**
 * Anchor for the radial menu in viewport coordinates. Lives on the picker
 * state so we can position the popover precisely against the long-pressed
 * word.
 */
export interface PickerAnchor {
  /** Viewport x (CSS pixels). */
  x: number;
  /** Viewport y (CSS pixels). */
  y: number;
}

interface PickingState<TItem, TPayload> {
  /** Caller-supplied payload (e.g. the word) carried for the lifetime of the gesture. */
  payload: TPayload;
  /** Anchor point — usually the viewport position of the word's centre. */
  anchor: PickerAnchor;
  /** Index into `items` of the currently-targeted option, or -1 for "none". */
  activeIndex: number;
  /** Items being chosen between (frozen at gesture start). */
  items: ReadonlyArray<TItem>;
}

interface UseRadialPickerOptions<TItem, TPayload> {
  /** Distance from the anchor at which an option becomes "active". */
  innerRadius?: number;
  /** Distance beyond which the gesture is committed (drag ended outside). */
  outerRadius?: number;
  /**
   * Called when the user releases inside the active radius on top of an
   * option. Receives both the payload and the chosen item.
   */
  onSelect: (payload: TPayload, item: TItem) => void;
  /**
   * Called when the user releases without picking — quick tap (before
   * long-press) or release at centre. Useful for a "default mode" tap-to-mark.
   */
  onQuickTap?: (payload: TPayload) => void;
}

interface BeginGestureArgs<TItem, TPayload> {
  payload: TPayload;
  /** Items to choose between. The order is the visual order in the picker. */
  items: ReadonlyArray<TItem>;
  /** Anchor point in viewport coordinates. */
  anchor: PickerAnchor;
  /** Initial pointer position (used as the starting reference for movement). */
  pointer: PickerAnchor;
  /** Pointer id from the originating event, used for `setPointerCapture`. */
  pointerId: number;
  /** Element to set pointer capture on so movement keeps streaming to it. */
  capturingElement: Element;
}

/**
 * Compute which option the pointer is currently over.
 *
 * Options are laid out in a fan above the anchor — see `RadialMistakePicker`
 * for the matching geometry. This function mirrors that layout to convert a
 * pointer position back into an option index.
 *
 * Returns `-1` when the pointer is inside the dead-zone (too close to the
 * anchor) so the user can cancel by releasing in place.
 */
function computeActiveIndex(
  anchor: PickerAnchor,
  pointer: PickerAnchor,
  itemCount: number,
  innerRadius: number,
): number {
  if (itemCount === 0) return -1;

  const dx = pointer.x - anchor.x;
  const dy = pointer.y - anchor.y;
  const distance = Math.hypot(dx, dy);
  if (distance < innerRadius) return -1;

  // Atan2 returns radians in (-π, π]. We want an angle measured from
  // straight-up (negative y), increasing clockwise, in [0, 2π).
  // 1) atan2(dy, dx) gives angle from +x axis, increasing counter-clockwise.
  // 2) Add π/2 so 0 corresponds to "up".
  // 3) Normalise into [0, 2π).
  let angle = Math.atan2(dy, dx) + Math.PI / 2;
  if (angle < 0) angle += Math.PI * 2;

  // Each option occupies a slice of the circle centred on its anchor angle.
  // For a 3-item fan this gives 120° slices; the 0° slice is straight up,
  // matching the layout in RadialMistakePicker.
  const sliceSize = (Math.PI * 2) / itemCount;
  const idx = Math.floor((angle + sliceSize / 2) / sliceSize) % itemCount;
  return idx;
}

/**
 * Trigger a short haptic pulse where supported. Safe to call unconditionally
 * — falls back to a no-op on iOS Safari and other browsers without the API.
 */
function triggerHaptic(): void {
  if (typeof navigator === "undefined") return;
  const vibrate = navigator.vibrate?.bind(navigator);
  if (typeof vibrate === "function") {
    try {
      vibrate(HAPTIC_PULSE_MS);
    } catch {
      // Some user-agents throw when called from a non-interaction context.
    }
  }
}

export interface UseRadialPickerReturn<TItem, TPayload> {
  /** Current picking state, or null when not active. Drives the UI. */
  state: PickingState<TItem, TPayload> | null;
  /**
   * Begin tracking a gesture. Call from the `pointerdown` handler on the
   * triggering element. The hook will install document-level listeners and
   * tear them down automatically when the gesture ends.
   */
  beginGesture: (args: BeginGestureArgs<TItem, TPayload>) => void;
}

/**
 * Headless radial-picker gesture hook.
 *
 * @example
 * const picker = useRadialPicker<MistakeType, MushafWord>({ onSelect, onQuickTap });
 * <span onPointerDown={(e) => picker.beginGesture({ ... })} />
 * {picker.state && <RadialMistakePicker {...picker.state} />}
 */
export function useRadialPicker<TItem, TPayload>(
  options: UseRadialPickerOptions<TItem, TPayload>,
): UseRadialPickerReturn<TItem, TPayload> {
  const { innerRadius = 32, onSelect, onQuickTap } = options;

  // Active picking state drives rendering.
  const [state, setState] = useState<PickingState<TItem, TPayload> | null>(
    null,
  );

  // Refs for values that should not retrigger React renders or stale-close
  // over the document listeners. We deliberately read these synchronously
  // inside event handlers.
  const stateRef = useRef<PickingState<TItem, TPayload> | null>(null);
  stateRef.current = state;

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<TPayload | null>(null);
  const pendingItemsRef = useRef<ReadonlyArray<TItem> | null>(null);
  const pendingAnchorRef = useRef<PickerAnchor | null>(null);
  const pointerStartRef = useRef<PickerAnchor | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const capturingElementRef = useRef<Element | null>(null);

  /**
   * Tear down all gesture state, listeners, and timers. Idempotent.
   */
  const cleanup = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const el = capturingElementRef.current;
    const pid = pointerIdRef.current;
    if (
      el &&
      pid !== null &&
      // Older Safari may not implement releasePointerCapture; guard.
      typeof (el as Element & {
        releasePointerCapture?: (id: number) => void;
      }).releasePointerCapture === "function"
    ) {
      try {
        (el as Element & { releasePointerCapture: (id: number) => void })
          .releasePointerCapture(pid);
      } catch {
        // Capture may have already been released by the browser.
      }
    }

    pendingPayloadRef.current = null;
    pendingItemsRef.current = null;
    pendingAnchorRef.current = null;
    pointerStartRef.current = null;
    pointerIdRef.current = null;
    capturingElementRef.current = null;
  }, []);

  /**
   * Long-press timer handler — promotes the gesture from PRESSING to PICKING.
   */
  const handleLongPressFire = useCallback(() => {
    longPressTimerRef.current = null;

    const payload = pendingPayloadRef.current;
    const items = pendingItemsRef.current;
    const anchor = pendingAnchorRef.current;
    if (payload === null || items === null || anchor === null) return;

    // Capture the pointer *now* — only once we are sure this is a long-press
    // and not a scroll. Capturing at pointerdown (the previous behaviour)
    // stole the gesture from the browser's scroller, so the page could not
    // be scrolled by starting the touch on a word. Deferring it here keeps
    // native vertical scrolling responsive until the press is confirmed.
    const el = capturingElementRef.current as
      | (Element & { setPointerCapture?: (id: number) => void })
      | null;
    const pid = pointerIdRef.current;
    if (el && pid !== null) {
      try {
        el.setPointerCapture?.(pid);
      } catch {
        // Older browsers / disconnected nodes — document listeners still fire.
      }
    }

    triggerHaptic();
    setState({ payload, items, anchor, activeIndex: -1 });
  }, []);

  /**
   * PRESSING-phase pointermove — cancels the gesture if the pointer drifts
   * beyond MOVE_TOLERANCE_PX so the browser can scroll the page freely.
   *
   * Registered permanently as { passive: true } so the browser never has to
   * wait for JS before deciding to scroll. It must never call e.preventDefault().
   */
  const handlePointerMovePressing = useCallback(
    (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      // Only relevant while the long-press timer is still running.
      if (longPressTimerRef.current === null) return;
      const start = pointerStartRef.current;
      if (!start) return;
      const distance = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      if (distance > MOVE_TOLERANCE_PX) {
        // Pointer moved too far before long-press fired — treat as a scroll.
        cleanup();
      }
    },
    [cleanup],
  );

  /**
   * PICKING-phase pointermove — recomputes the active option and calls
   * e.preventDefault() to prevent the page from scrolling while the teacher
   * drags toward a mistake type.
   *
   * Registered as { passive: false } ONLY while the picker is open (state ≠
   * null) so the non-passive cost is never paid during normal scrolling.
   */
  const handlePointerMovePicking = useCallback(
    (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      const current = stateRef.current;
      if (!current) return;
      const idx = computeActiveIndex(
        current.anchor,
        { x: e.clientX, y: e.clientY },
        current.items.length,
        innerRadius,
      );
      if (idx !== current.activeIndex) {
        setState({ ...current, activeIndex: idx });
      }
      e.preventDefault();
    },
    [innerRadius],
  );

  /**
   * Document-level pointerup / pointercancel listener.
   *
   * - If the long-press timer is still pending, treat as a quick tap.
   * - Otherwise commit the active option (or cancel if none).
   */
  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;

      // Capture refs *before* cleanup wipes them.
      const payload = pendingPayloadRef.current;
      const wasPressing = longPressTimerRef.current !== null;
      const current = stateRef.current;

      if (wasPressing && payload !== null && e.type !== "pointercancel") {
        // Quick tap: long-press never fired and the user did not cancel.
        cleanup();
        setState(null);
        onQuickTap?.(payload);
        return;
      }

      if (current && current.activeIndex >= 0) {
        const item = current.items[current.activeIndex];
        if (item !== undefined) {
          onSelect(current.payload, item);
        }
      }
      cleanup();
      setState(null);
    },
    [cleanup, onQuickTap, onSelect],
  );

  // Always-on, passive listener — handles PRESSING-phase scroll detection
  // and pointer-up/cancel for the full gesture lifecycle.
  useEffect(() => {
    document.addEventListener("pointermove", handlePointerMovePressing, {
      passive: true,
    });
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMovePressing);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerMovePressing, handlePointerUp]);

  // Non-passive listener installed ONLY while the picker is open.
  // `isPicking` is boolean so this effect only re-runs on open/close, not on
  // every activeIndex update — avoiding rapid listener churn during dragging.
  const isPicking = state !== null;
  useEffect(() => {
    if (!isPicking) return;
    document.addEventListener("pointermove", handlePointerMovePicking, {
      passive: false,
    });
    return () => {
      document.removeEventListener("pointermove", handlePointerMovePicking);
    };
  }, [isPicking, handlePointerMovePicking]);

  // Cancel any in-flight gesture if the component using the hook unmounts.
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const beginGesture = useCallback(
    (args: BeginGestureArgs<TItem, TPayload>) => {
      // Abort any previous gesture (e.g. multi-touch start).
      cleanup();

      pendingPayloadRef.current = args.payload;
      pendingItemsRef.current = args.items;
      pendingAnchorRef.current = args.anchor;
      pointerStartRef.current = args.pointer;
      pointerIdRef.current = args.pointerId;
      capturingElementRef.current = args.capturingElement;

      // NOTE: pointer capture is intentionally deferred until the long-press
      // timer fires (see handleLongPressFire). Capturing here would block the
      // browser's native vertical scroll when the touch starts on a word.

      longPressTimerRef.current = setTimeout(
        handleLongPressFire,
        LONG_PRESS_MS,
      );
    },
    [cleanup, handleLongPressFire],
  );

  return { state, beginGesture };
}
