"use client";

/**
 * PendingMistakesPanel
 *
 * Collapsible review drawer that shows all pending (unsaved) mistakes
 * across all pages. Rendered inside a slide-up panel at the bottom of the
 * assessor, above the save bar.
 */

import { MistakeType } from "@halaqat/types";
import { Trash2, X } from "lucide-react";
import React, { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import type { PendingMistake } from "../hooks/usePendingMistakes";
import { getMistakeStyle } from "../mistake-style";

interface PendingMistakesPanelProps {
  open: boolean;
  pendingMistakesByPage: Record<number, PendingMistake[]>;
  pendingForPage: PendingMistake[];
  totalCount: number;
  currentPage: number;
  onClose: () => void;
  onRemove: (location: string, page: number) => void;
  onClearPage: (page: number) => void;
}

export const PendingMistakesPanel = React.memo<PendingMistakesPanelProps>(
  ({
    open,
    pendingMistakesByPage,
    pendingForPage,
    totalCount,
    currentPage,
    onClose,
    onRemove,
    onClearPage,
  }) => {
    const [confirmClear, setConfirmClear] = useState(false);

    if (!open || totalCount === 0) return null;

    const allMistakesFlat = Object.entries(pendingMistakesByPage)
      .filter(([, list]) => list.length > 0)
      .sort(([a], [b]) => Number(a) - Number(b))
      .flatMap(([page, list]) =>
        list.map((m) => ({ ...m, _page: Number(page) })),
      );

    return (
      <>
        <div
          className="flex-none border-t flex flex-col max-h-[40vh] bg-background shadow-lg"
          role="region"
          aria-label="الأخطاء المعلقة"
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b">
            <span className="text-sm font-bold">
              الأخطاء المعلقة
              <span
                className="mx-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white tabular-nums"
                aria-label={`${totalCount} خطأ`}
              >
                {totalCount}
              </span>
            </span>
            <div className="flex items-center gap-1">
              {/* Clear current page — requires confirmation */}
              <button
                onClick={() => setConfirmClear(true)}
                disabled={pendingForPage.length === 0}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
                aria-label={`حذف أخطاء الصفحة ${currentPage}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                حذف صفحة {currentPage}
              </button>
              <button
                onClick={onClose}
                className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="إغلاق لوحة المراجعة"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5" role="list">
              {allMistakesFlat.map((m) => {
                const style = getMistakeStyle(m.mistakeType as MistakeType);
                const Icon = style.icon;
                return (
                  <div
                    key={`${m._page}:${m.wordLocation}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                    role="listitem"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          "flex-none inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded",
                          style.bgSoft,
                          style.textSoft,
                        )}
                      >
                        <Icon className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                        {style.label}
                      </span>
                      <span className="font-['Uthmanic'] text-lg leading-none truncate">
                        {m.wordText}
                      </span>
                      <span
                        className="text-[10px] text-muted-foreground shrink-0 tabular-nums"
                        dir="ltr"
                      >
                        ص{m._page} · {m.surahNumber}:{m.ayahNumber}:
                        {m.wordPosition}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemove(m.wordLocation, m._page)}
                      className="flex-none h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      aria-label={`إزالة خطأ: ${m.wordText}`}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Confirm clear page dialog */}
        <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>حذف أخطاء الصفحة {currentPage}؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف {pendingForPage.length}{" "}
                {pendingForPage.length === 1
                  ? "خطأ"
                  : pendingForPage.length === 2
                    ? "خطأين"
                    : "أخطاء"}{" "}
                من الصفحة الحالية. هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  onClearPage(currentPage);
                  setConfirmClear(false);
                }}
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  },
);
PendingMistakesPanel.displayName = "PendingMistakesPanel";
