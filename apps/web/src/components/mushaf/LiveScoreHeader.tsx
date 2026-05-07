"use client";

/**
 * LiveScoreHeader
 *
 * Compact, always-visible row that mirrors the "live receipt" of the
 * recitation as the teacher taps. Shows:
 *
 * - Per-mistake-type counts as small coloured chips.
 * - Current numeric score (out of 10) as the prominent figure.
 * - Suggested quality bucket (مَمتاز / جيد جداً / جيد / إعادة) with a
 *   "هل تؤكد التقييم؟" hint when the teacher has not explicitly confirmed.
 *
 * Receives all data as plain props — has no knowledge of how the counts are
 * computed, which makes it trivial to reuse for the per-page summary in
 * the review panel.
 */

import { RecitationQuality } from "@halaqat/types";
import type { MistakeCounts, PageScoreResult } from "@halaqat/types";
import { ShieldAlert } from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

import {
  MISTAKE_TYPES_IN_ORDER,
  getMistakeStyle,
} from "./mistake-style";

const QUALITY_LABEL: Record<RecitationQuality, string> = {
  [RecitationQuality.EXCELLENT]: "ممتاز",
  [RecitationQuality.VERY_GOOD]: "جيد جداً",
  [RecitationQuality.GOOD]: "جيد",
  [RecitationQuality.ACCEPTABLE]: "مقبول",
  [RecitationQuality.POOR]: "إعادة",
};

const QUALITY_TEXT_CLASS: Record<RecitationQuality, string> = {
  [RecitationQuality.EXCELLENT]: "text-emerald-600 dark:text-emerald-400",
  [RecitationQuality.VERY_GOOD]: "text-green-600 dark:text-green-400",
  [RecitationQuality.GOOD]: "text-blue-600 dark:text-blue-400",
  [RecitationQuality.ACCEPTABLE]: "text-amber-600 dark:text-amber-400",
  [RecitationQuality.POOR]: "text-red-600 dark:text-red-400",
};

interface LiveScoreHeaderProps {
  /** Mistake counts the score was computed from (pending + saved combined). */
  counts: MistakeCounts;
  /** Result from `calculatePageScore`. */
  result: PageScoreResult;
  /**
   * Quality the teacher has explicitly chosen — when set, overrides
   * `result.suggestedQuality`. The header still shows the suggested value
   * dimmed so the teacher can see what the auto-rule would have picked.
   */
  overrideQuality?: RecitationQuality | null;
  className?: string;
}

export const LiveScoreHeader: React.FC<LiveScoreHeaderProps> = ({
  counts,
  result,
  overrideQuality,
  className,
}) => {
  const effectiveQuality = overrideQuality ?? result.suggestedQuality;
  const isOverridden =
    overrideQuality !== null &&
    overrideQuality !== undefined &&
    overrideQuality !== result.suggestedQuality;

  // Total mistakes used both as a "no mistakes yet" hint and to render the
  // tap counter in the corner.
  const totalMistakes = MISTAKE_TYPES_IN_ORDER.reduce(
    (sum, t) => sum + (counts[t] ?? 0),
    0,
  );

  return (
    <div
      className={cn(
        "flex items-stretch justify-between gap-3 px-3 py-2 border-b bg-card",
        className,
      )}
    >
      {/* Left: per-type chips. Always render all types so the teacher's
          eye can sweep a fixed location, even if a type has zero count. */}
      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
        {MISTAKE_TYPES_IN_ORDER.map((type) => {
          const style = getMistakeStyle(type);
          const n = counts[type] ?? 0;
          const Icon = style.icon;
          return (
            <span
              key={type}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums transition-opacity",
                style.bgSoft,
                style.textSoft,
                n === 0 && "opacity-50",
              )}
              title={style.label}
            >
              <Icon className="h-3 w-3" strokeWidth={2.5} />
              <span>{n}</span>
            </span>
          );
        })}
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums",
            totalMistakes === 0 && "opacity-60",
          )}
          title="عدد النقرات"
        >
          {totalMistakes} نقرة
        </span>
      </div>

      {/* Right: score + quality verdict. */}
      <div className="flex flex-col items-end justify-center shrink-0">
        <div className="flex items-baseline gap-1 leading-none">
          <span className="text-xl font-black tabular-nums text-foreground">
            {result.score.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            / {result.maxScore}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {result.triggeredHardRule && (
            <ShieldAlert
              className="h-3 w-3 text-red-500"
              aria-label={result.triggeredHardRule.reason}
            />
          )}
          <span
            className={cn(
              "text-[11px] font-bold leading-none",
              QUALITY_TEXT_CLASS[effectiveQuality],
              isOverridden && "underline decoration-dotted underline-offset-2",
            )}
          >
            {QUALITY_LABEL[effectiveQuality]}
          </span>
        </div>
      </div>
    </div>
  );
};
