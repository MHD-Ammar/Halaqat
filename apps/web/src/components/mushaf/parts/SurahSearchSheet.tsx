"use client";

/**
 * SurahSearchSheet
 *
 * Full-screen overlay for navigating to a surah or jumping directly to a
 * page number. Extracted from MushafAssessor — no logic changes, just
 * isolated into its own component so the parent stays thin.
 */

import { Check, Loader2, Search, X } from "lucide-react";
import React, { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SurahEntry {
  number: number;
  nameArabic: string;
  nameEnglish: string;
  startPage: number;
}

interface SurahSearchSheetProps {
  open: boolean;
  surahs: SurahEntry[] | undefined;
  onClose: () => void;
  onSelectPage: (page: number) => void;
}

export const SurahSearchSheet = React.memo<SurahSearchSheetProps>(
  ({ open, surahs, onClose, onSelectPage }) => {
    const [navSearch, setNavSearch] = useState("");
    const [pageInputVal, setPageInputVal] = useState("");

    const filteredSurahs = useMemo(() => {
      if (!surahs) return [];
      const q = navSearch.trim();
      if (!q) return surahs;
      const ql = q.toLowerCase();
      return surahs.filter(
        (s) =>
          s.nameArabic.includes(q) ||
          s.nameEnglish.toLowerCase().includes(ql) ||
          String(s.number) === q,
      );
    }, [surahs, navSearch]);

    const handleClose = () => {
      setNavSearch("");
      setPageInputVal("");
      onClose();
    };

    const handlePageJump = (val: string) => {
      const n = parseInt(val, 10);
      if (Number.isFinite(n) && n >= 1 && n <= 604) {
        onSelectPage(n);
        handleClose();
      }
    };

    if (!open) return null;

    const pageNum = parseInt(pageInputVal, 10);
    const isValidPage =
      !!pageInputVal && Number.isFinite(pageNum) && pageNum >= 1 && pageNum <= 604;

    return (
      <div
        className="absolute inset-0 z-40 flex flex-col bg-background"
        role="dialog"
        aria-label="الانتقال إلى سورة أو صفحة"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-4 py-3 border-b bg-card shadow-sm">
          <h2 className="font-bold text-lg">الانتقال إلى</h2>
          <button
            onClick={handleClose}
            className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Direct page jump */}
        <div className="flex-none px-4 py-3 border-b bg-muted/20">
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            الانتقال المباشر للصفحة (1 – 604)
          </p>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              max={604}
              value={pageInputVal}
              onChange={(e) => setPageInputVal(e.target.value)}
              placeholder="رقم الصفحة..."
              className="flex-1 h-11 text-center text-lg font-bold"
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePageJump(pageInputVal);
              }}
              aria-label="أدخل رقم الصفحة"
            />
            <button
              onClick={() => handlePageJump(pageInputVal)}
              disabled={!isValidPage}
              className={cn(
                "h-11 px-4 rounded-lg font-bold text-sm transition-all",
                isValidPage
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                  : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed",
              )}
              aria-label="انتقال إلى الصفحة"
            >
              <Check className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        {/* Surah search */}
        <div className="flex-none px-4 py-2 border-b bg-card">
          <div className="relative">
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden
            />
            <Input
              placeholder="ابحث في السور..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="h-10 pr-9"
              autoFocus
              aria-label="ابحث في السور"
            />
          </div>
        </div>

        {/* Surah list */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          role="list"
          aria-label="قائمة السور"
        >
          {!surahs ? (
            <div className="flex items-center justify-center p-8">
              <Loader2
                className="h-5 w-5 animate-spin text-muted-foreground"
                aria-label="جاري التحميل"
              />
            </div>
          ) : filteredSurahs.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
              لا توجد نتائج
            </div>
          ) : (
            <div className="divide-y">
              {filteredSurahs.map((surah) => (
                <button
                  key={surah.number}
                  onClick={() => {
                    onSelectPage(surah.startPage);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors text-right"
                  role="listitem"
                  aria-label={`${surah.nameArabic} — صفحة ${surah.startPage}`}
                >
                  <div
                    className="flex-none h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary tabular-nums"
                    dir="ltr"
                  >
                    {surah.number}
                  </div>
                  <div className="flex-1 text-right min-w-0">
                    <div className="font-['Uthmanic'] text-lg leading-tight">
                      {surah.nameArabic}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {surah.nameEnglish}
                    </div>
                  </div>
                  <div
                    className="flex-none text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-medium tabular-nums"
                    dir="ltr"
                  >
                    ص {surah.startPage}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);
SurahSearchSheet.displayName = "SurahSearchSheet";
