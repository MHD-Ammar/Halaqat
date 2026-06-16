"use client";

/**
 * StudentMistakeSummary
 *
 * Floating, student-facing summary of the mistakes marked on the current
 * Mushaf page. Replaces the bare colour legend with something more useful:
 * it shows, per mistake type, how many were marked — so the student can see
 * at a glance *what kind* of mistakes they made and *how many*, then look at
 * the highlighted words on the page to find them.
 *
 * It is intentionally read-only and gentle in tone: the goal is to help the
 * student review and improve, not to scold. When the page has no mistakes the
 * component renders nothing (the parent decides whether to show an
 * encouraging "clean page" state instead).
 *
 * Driven entirely by {@link MISTAKE_TYPES_IN_ORDER} so adding a mistake type
 * is a one-line change.
 */

import { MistakeType } from "@halaqat/types";
import React from "react";

import { cn } from "@/lib/utils";

import { getMistakeStyle, MISTAKE_TYPES_IN_ORDER } from "./mistake-style";

interface StudentMistakeSummaryProps {
  /** Count of mistakes on the current page, keyed by type. */
  counts: Partial<Record<MistakeType, number>>;
  className?: string;
}

export const StudentMistakeSummary: React.FC<StudentMistakeSummaryProps> = ({
  counts,
  className,
}) => {
  const total = MISTAKE_TYPES_IN_ORDER.reduce(
    (sum, type) => sum + (counts[type] ?? 0),
    0,
  );

  if (total === 0) return null;

  return (
    <div
      dir="rtl"
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-primary/20 bg-background/90 px-4 py-2.5 shadow-lg backdrop-blur-md",
        className,
      )}
    >
      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
        أخطاء هذه الصفحة
      </span>
      <div className="h-5 w-px bg-border" />
      <div className="flex items-center gap-3">
        {MISTAKE_TYPES_IN_ORDER.map((type) => {
          const n = counts[type] ?? 0;
          const style = getMistakeStyle(type);
          const Icon = style.icon;
          return (
            <div
              key={type}
              className={cn(
                "flex items-center gap-1.5",
                n === 0 && "opacity-35",
              )}
              title={`${style.label}: ${n}`}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full",
                  style.bgSoft,
                  style.textSoft,
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <span className="text-sm font-bold tabular-nums">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
