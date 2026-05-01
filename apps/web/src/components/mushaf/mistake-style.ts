/**
 * MistakeStyle
 *
 * Single source of truth for the visual styling of each {@link MistakeType}.
 * Used by:
 * - The radial picker (option chips, drag highlight)
 * - The Mushaf word renderer (highlight underlines + tints)
 * - The pending mistakes list and counters
 * - The legend and live score header
 *
 * Centralising this in one file keeps colours consistent across the feature
 * and makes it trivial to swap the palette later (e.g., for a "colour-blind"
 * mode) without hunting through components.
 */

import { MistakeType } from "@halaqat/types";
import { Brain, Headphones, Pen, type LucideIcon } from "lucide-react";


/**
 * Visual configuration for a single mistake type.
 *
 * Tailwind classes are written out explicitly (rather than constructed at
 * runtime) so that the JIT compiler can statically detect them and emit the
 * required CSS — interpolation like `bg-${color}-500` would not work.
 */
export interface MistakeStyle {
  type: MistakeType;
  /** Short Arabic label used inside the radial picker and chips. */
  label: string;
  /** Lucide icon component shown in the picker and chips. */
  icon: LucideIcon;

  /** Hex value for canvas / SVG drawing. */
  hex: string;

  /** Tailwind solid-fill background (e.g. picker option highlight). */
  bgSolid: string;
  /** Tailwind text-on-solid colour to pair with `bgSolid`. */
  textOnSolid: string;

  /** Tailwind soft tint background for the underline / pending chip. */
  bgSoft: string;
  /** Tailwind border colour for the underline. */
  borderColor: string;
  /** Tailwind text colour for chips on top of the soft tint. */
  textSoft: string;
  /** Tailwind ring colour used for the drag-active highlight. */
  ringColor: string;
}

/**
 * Map of every supported mistake type to its visual style.
 *
 * Order matters: this is the canonical display order in the radial picker
 * (top → right → left in a 3-option fan).
 */
export const MISTAKE_STYLES: Record<MistakeType, MistakeStyle> = {
  [MistakeType.MEMORIZATION]: {
    type: MistakeType.MEMORIZATION,
    label: "حفظ",
    icon: Brain,
    hex: "#ef4444",
    bgSolid: "bg-red-500",
    textOnSolid: "text-white",
    bgSoft: "bg-red-500/15",
    borderColor: "border-red-500",
    textSoft: "text-red-700 dark:text-red-300",
    ringColor: "ring-red-500",
  },
  [MistakeType.TAJWEED]: {
    type: MistakeType.TAJWEED,
    label: "تجويد",
    icon: Headphones,
    hex: "#f59e0b",
    bgSolid: "bg-amber-500",
    textOnSolid: "text-white",
    bgSoft: "bg-amber-500/15",
    borderColor: "border-amber-500",
    textSoft: "text-amber-700 dark:text-amber-300",
    ringColor: "ring-amber-500",
  },
  [MistakeType.TASHKEEL]: {
    type: MistakeType.TASHKEEL,
    label: "تشكيل",
    icon: Pen,
    hex: "#3b82f6",
    bgSolid: "bg-blue-500",
    textOnSolid: "text-white",
    bgSoft: "bg-blue-500/15",
    borderColor: "border-blue-500",
    textSoft: "text-blue-700 dark:text-blue-300",
    ringColor: "ring-blue-500",
  },
};

/**
 * Canonical display order (used by picker + legend).
 */
export const MISTAKE_TYPES_IN_ORDER: ReadonlyArray<MistakeType> = [
  MistakeType.MEMORIZATION,
  MistakeType.TAJWEED,
  MistakeType.TASHKEEL,
];

/**
 * Convenience accessor — returns the style for a type, falling back to the
 * MEMORIZATION style if an unknown value sneaks in (defensive against
 * hand-edited DB rows or stale clients).
 */
export function getMistakeStyle(type: MistakeType): MistakeStyle {
  return MISTAKE_STYLES[type] ?? MISTAKE_STYLES[MistakeType.MEMORIZATION];
}
