"use client";

/**
 * PageHistorySheet
 *
 * A gentle, read-only panel that lists every recitation attempt a student has
 * made on a single Mushaf page — newest first. Each attempt shows when it was
 * recorded and a per-type breakdown of the mistakes (حفظ / تجويد / تشكيل).
 *
 * Used by both the student (to review their own past attempts) and the teacher
 * (to see how a page has improved across attempts). Purely informational: it
 * does not mutate anything. The "re-recite" action lives in the assessor.
 */

import { tallyMistakes } from "@halaqat/types";
import { History, CalendarClock, Sparkles, Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePageRecitationHistory } from "@/hooks/use-mushaf";
import { cn } from "@/lib/utils";

import { getMistakeStyle, MISTAKE_TYPES_IN_ORDER } from "./mistake-style";

interface PageHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  pageNumber: number;
}

export const PageHistorySheet: React.FC<PageHistorySheetProps> = ({
  open,
  onOpenChange,
  studentId,
  pageNumber,
}) => {
  const locale = useLocale();
  const { data: attempts, isLoading } = usePageRecitationHistory(
    studentId,
    pageNumber,
    open, // only fetch while the panel is open
  );

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(
        locale === "ar" ? "ar-SA" : "en-US",
        { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
      );
    } catch {
      return iso;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-h-[80vh] overflow-hidden flex flex-col p-0 max-w-[420px]"
      >
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center justify-center gap-2 text-center">
            <History className="h-5 w-5 text-primary" />
            سجل تسميع صفحة {pageNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !attempts || attempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <History className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                لا يوجد سجل تسميع لهذه الصفحة بعد
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt, idx) => {
                const counts = tallyMistakes(attempt.mistakes);
                const isLatest = idx === 0;
                return (
                  <div
                    key={attempt.recitationId ?? `none-${idx}`}
                    className={cn(
                      "rounded-2xl border p-3.5 transition-colors",
                      isLatest
                        ? "border-primary/40 bg-primary/5"
                        : "bg-card",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {formatDate(attempt.recitedAt)}
                      </div>
                      {isLatest && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                          <Sparkles className="h-3 w-3" />
                          الأحدث
                        </span>
                      )}
                    </div>

                    {attempt.mistakeCount === 0 ? (
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        بدون أخطاء — ما شاء الله 🌟
                      </p>
                    ) : (
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
                                n === 0 && "opacity-30",
                              )}
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
                              <span className="text-sm font-bold tabular-nums">
                                {n}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
