"use client";

/**
 * SaveBar
 *
 * Bottom action bar: undo button, pending-count / review toggle, and the
 * primary save button.
 */

import { Check, Loader2, Undo2 } from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

interface SaveBarProps {
  totalCount: number;
  pendingOnPageCount: number;
  isSaving: boolean;
  reviewOpen: boolean;
  /** Count across all pages that have any pending mistakes — used for the
   *  session aggregate chip (shows only when multiple pages touched). */
  pagesWithMistakesCount: number;
  onUndo: () => void;
  onToggleReview: () => void;
  onSave: () => void;
}

export const SaveBar = React.memo<SaveBarProps>(
  ({
    totalCount,
    pendingOnPageCount,
    isSaving,
    reviewOpen,
    onUndo,
    onToggleReview,
    onSave,
  }) => (
    <div className="flex-none flex items-center gap-2 px-3 py-2.5 border-t bg-card">
      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={pendingOnPageCount === 0}
        className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center disabled:opacity-30 hover:bg-muted/70 transition-colors active:scale-95"
        aria-label="تراجع عن آخر خطأ"
      >
        <Undo2 className="h-4 w-4" aria-hidden />
      </button>

      {/* Review toggle / empty state */}
      {totalCount > 0 ? (
        <button
          onClick={onToggleReview}
          className="h-10 px-3 rounded-xl text-sm font-bold flex items-center gap-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60 active:scale-95 transition-all"
          aria-label={`${totalCount} أخطاء معلقة — ${reviewOpen ? "إخفاء" : "مراجعة"}`}
          aria-expanded={reviewOpen}
        >
          <span className="min-w-[1.5rem] h-5 rounded-full bg-red-500 text-white text-xs font-bold inline-flex items-center justify-center px-1 tabular-nums">
            {totalCount}
          </span>
          {reviewOpen ? "إخفاء" : "مراجعة"}
        </button>
      ) : (
        <div className="h-10 px-3 rounded-xl text-sm flex items-center gap-1.5 bg-muted text-muted-foreground opacity-50 select-none">
          <span className="min-w-[1.5rem] h-5 rounded-full bg-muted-foreground/20 text-xs inline-flex items-center justify-center px-1 tabular-nums">
            0
          </span>
          أخطاء
        </div>
      )}

      {/* Save */}
      <button
        onClick={onSave}
        disabled={totalCount === 0 || isSaving}
        className={cn(
          "flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
          totalCount > 0 && !isSaving
            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            : "bg-muted text-muted-foreground cursor-not-allowed opacity-40",
        )}
        aria-label={
          isSaving
            ? "جاري الحفظ..."
            : totalCount > 0
              ? `حفظ ${totalCount} خطأ`
              : "لا توجد أخطاء للحفظ"
        }
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>جاري الحفظ...</span>
          </>
        ) : (
          <>
            <Check className="h-4 w-4" aria-hidden />
            حفظ الأخطاء
            {totalCount > 0 && (
              <span className="opacity-75 font-normal text-xs tabular-nums">
                ({totalCount})
              </span>
            )}
          </>
        )}
      </button>
    </div>
  ),
);
SaveBar.displayName = "SaveBar";
