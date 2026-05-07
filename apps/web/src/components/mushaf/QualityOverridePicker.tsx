"use client";

/**
 * QualityOverridePicker
 *
 * Inline 4-button row that lets the teacher confirm or override the
 * auto-suggested {@link RecitationQuality} for the current page.
 *
 * The component is deliberately stateless — it shows whichever value is
 * currently effective (override if set, otherwise suggestion) and asks the
 * caller to handle changes. This avoids any drift between the visible
 * highlight and what will be saved.
 */

import { RecitationQuality } from "@halaqat/types";
import React from "react";

import { cn } from "@/lib/utils";

interface QualityOption {
  value: RecitationQuality;
  label: string;
  /** Solid background when this option is the active choice. */
  activeClass: string;
  /** Hover background when this option is inactive. */
  inactiveClass: string;
}

const OPTIONS: ReadonlyArray<QualityOption> = [
  {
    value: RecitationQuality.EXCELLENT,
    label: "ممتاز",
    activeClass: "bg-emerald-500 text-white border-emerald-500",
    inactiveClass: "hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    value: RecitationQuality.VERY_GOOD,
    label: "جيد جداً",
    activeClass: "bg-green-500 text-white border-green-500",
    inactiveClass: "hover:bg-green-500/10 text-green-700 dark:text-green-300",
  },
  {
    value: RecitationQuality.GOOD,
    label: "جيد",
    activeClass: "bg-blue-500 text-white border-blue-500",
    inactiveClass: "hover:bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  {
    value: RecitationQuality.POOR,
    label: "إعادة",
    activeClass: "bg-red-500 text-white border-red-500",
    inactiveClass: "hover:bg-red-500/10 text-red-700 dark:text-red-300",
  },
];

interface QualityOverridePickerProps {
  /** The auto-suggested quality (from `calculatePageScore`). */
  suggested: RecitationQuality;
  /** The teacher's explicit override, or null to use the suggestion. */
  override: RecitationQuality | null;
  /** Called when the teacher taps any quality. Pass `null` to revert. */
  onChange: (next: RecitationQuality | null) => void;
  className?: string;
}

export const QualityOverridePicker: React.FC<QualityOverridePickerProps> = ({
  suggested,
  override,
  onChange,
  className,
}) => {
  const effective = override ?? suggested;

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-2",
        className,
      )}
    >
      <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
        <span className="font-medium">التقييم</span>
        {override !== null && override !== suggested && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-primary hover:underline"
            title="استخدم التقييم المقترح تلقائياً"
          >
            استخدم المقترح
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1">
        {OPTIONS.map((opt) => {
          const isActive = effective === opt.value;
          const isSuggested = suggested === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                // Tapping the suggested value clears the override; tapping
                // any other value sets it. This mirrors how a single button
                // would behave in a typical confirm/override UI.
                onChange(opt.value === suggested ? null : opt.value)
              }
              className={cn(
                "relative h-9 rounded-md border text-xs font-bold transition-all duration-150 active:scale-95",
                isActive ? opt.activeClass : opt.inactiveClass,
                !isActive && "border-transparent",
              )}
            >
              {opt.label}
              {isSuggested && !isActive && (
                <span
                  className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-primary"
                  title="مقترح تلقائياً"
                  aria-label="مقترح تلقائياً"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
