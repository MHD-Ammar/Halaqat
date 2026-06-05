"use client";

/**
 * AssessorToolbar
 *
 * Top bar of the Mushaf Assessor: page navigation (prev/next/page-jump
 * button) and current surah name display.
 *
 * The mode toggle (حفظ / تجويد) lives in the radial picker flow, not here —
 * teachers pick the mistake type at the moment of marking, not upfront.
 */

import { BookMarked, ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

interface AssessorToolbarProps {
  currentPage: number;
  surahName?: string;
  onPrevPage: () => void;
  onNextPage: () => void;
  onOpenNav: () => void;
}

export const AssessorToolbar = React.memo<AssessorToolbarProps>(
  ({ currentPage, surahName, onPrevPage, onNextPage, onOpenNav }) => (
    <div className="flex-none flex items-center gap-2 px-3 py-2 border-b bg-card shadow-sm">
      <button
        onClick={onOpenNav}
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold transition-colors active:scale-95 max-w-[40%] truncate"
        title="الانتقال إلى سورة أو صفحة"
        aria-label={`${surahName ?? "سورة"} — فتح قائمة التنقل`}
      >
        <BookMarked className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{surahName ?? "سورة"}</span>
      </button>

      <div className="ms-auto flex items-center gap-1">
        <button
          onClick={onNextPage}
          disabled={currentPage >= 604}
          className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center disabled:opacity-40 hover:bg-muted/70 active:scale-95 transition-all"
          aria-label="الصفحة التالية"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>

        <button
          onClick={onOpenNav}
          className="h-9 min-w-[3.5rem] px-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary font-bold text-sm transition-colors tabular-nums"
          aria-label={`الصفحة الحالية: ${currentPage}، انقر للانتقال`}
        >
          {currentPage}
        </button>

        <button
          onClick={onPrevPage}
          disabled={currentPage <= 1}
          className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center disabled:opacity-40 hover:bg-muted/70 active:scale-95 transition-all"
          aria-label="الصفحة السابقة"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  ),
);
AssessorToolbar.displayName = "AssessorToolbar";
