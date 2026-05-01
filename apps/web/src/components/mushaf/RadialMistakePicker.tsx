"use client";

/**
 * RadialMistakePicker
 *
 * Floating popover rendered while the user is mid long-press on a Mushaf
 * word. Options fan out around the anchor point; the option closest to the
 * pointer is highlighted, and releasing on it commits the choice.
 *
 * This component is purely presentational — gesture state is owned by
 * `useRadialPicker` so the popover does not install any pointer listeners
 * itself.
 *
 * Layout:
 *
 *   For N options laid out on a circle of radius R around the anchor (Ax,Ay),
 *   option i is positioned at angle θᵢ measured from straight-up, clockwise:
 *
 *       θᵢ = (i / N) · 2π
 *       xᵢ = Ax + R · sin(θᵢ)
 *       yᵢ = Ay − R · cos(θᵢ)   // minus because viewport y grows downward
 *
 *   The active-index calculation in `useRadialPicker.computeActiveIndex` is
 *   the inverse of this mapping — keep them in sync if the geometry ever
 *   changes.
 */

import type { MistakeType } from "@halaqat/types";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

import { getMistakeStyle } from "./mistake-style";

interface RadialMistakePickerProps {
  /** Anchor point in viewport (CSS) pixels. */
  anchor: { x: number; y: number };
  /** Mistake types to display, in fan order (top → clockwise). */
  items: ReadonlyArray<MistakeType>;
  /** Index in `items` of the currently-targeted option, or -1 for none. */
  activeIndex: number;
  /**
   * Distance from the anchor to each option's centre. Should match the
   * sizing assumed by the gesture hook.
   */
  radius?: number;
  /** Diameter of each option chip in pixels. */
  chipSize?: number;
}

/**
 * Compute the (x, y) centre of option `i` given fan layout parameters.
 */
function getOptionPosition(
  anchor: { x: number; y: number },
  index: number,
  total: number,
  radius: number,
): { x: number; y: number } {
  const angle = (index / total) * Math.PI * 2;
  return {
    x: anchor.x + Math.sin(angle) * radius,
    y: anchor.y - Math.cos(angle) * radius,
  };
}

export const RadialMistakePicker: React.FC<RadialMistakePickerProps> = ({
  anchor,
  items,
  activeIndex,
  radius = 72,
  chipSize = 56,
}) => {
  // Portal target. We render into document.body so the picker can escape
  // any clipping/overflow on its ancestors (e.g. the bottom sheet content
  // has overflow:hidden).
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalTarget(typeof document !== "undefined" ? document.body : null);
  }, []);

  if (!portalTarget) return null;

  return createPortal(
    <div
      // Cover the viewport so the dimmed backdrop is visible everywhere.
      // pointer-events: none lets the original pointermove keep streaming
      // to the document listener inside `useRadialPicker`.
      className="fixed inset-0 z-[100] pointer-events-none"
      aria-hidden="true"
    >
      {/* Subtle dim of the page behind the picker, fades in. */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-150" />

      {/* Anchor pulse — a small dot at the long-pressed word so the user can
          orient themselves relative to it. */}
      <div
        className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg ring-2 ring-primary"
        style={{ left: anchor.x, top: anchor.y }}
      />

      {items.map((type, idx) => {
        const style = getMistakeStyle(type);
        const position = getOptionPosition(anchor, idx, items.length, radius);
        const isActive = idx === activeIndex;
        const Icon = style.icon;

        return (
          <div
            key={type}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
              "flex flex-col items-center justify-center gap-0.5",
              "shadow-xl transition-all duration-150 ease-out",
              "animate-in zoom-in-50 fade-in duration-200",
              style.bgSolid,
              style.textOnSolid,
              isActive
                ? "scale-125 ring-4 ring-white/90 shadow-2xl"
                : "scale-100 opacity-95",
            )}
            style={{
              left: position.x,
              top: position.y,
              width: chipSize,
              height: chipSize,
              animationDelay: `${idx * 30}ms`,
            }}
          >
            <Icon className="h-5 w-5" strokeWidth={2.5} />
            <span className="text-[10px] font-bold leading-none">
              {style.label}
            </span>
          </div>
        );
      })}

      {/* Hint text — appears under the anchor only while the user is in
          the dead-zone, nudging them to drag toward an option. */}
      {activeIndex < 0 && (
        <div
          className="absolute -translate-x-1/2 translate-y-3 rounded-md bg-foreground/85 px-3 py-1 text-[11px] font-medium text-background shadow-md animate-in fade-in duration-200"
          style={{
            left: anchor.x,
            top: anchor.y + radius + 16,
          }}
        >
          اسحب نحو نوع الخطأ
        </div>
      )}
    </div>,
    portalTarget,
  );
};
