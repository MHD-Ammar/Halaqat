"use client";

import type { MushafWord } from "@halaqat/types";
import {
  BookMarked,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  triggerPrefetch,
  useBulkCreateMistakes,
  useMushafPage,
  useStudentMistakes,
  useStudentMushafState,
} from "@/hooks/use-mushaf";
import { useSurahsWithPages } from "@/hooks/use-surahs-with-pages";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { MushafPageRenderer } from "./MushafPageRenderer";

interface PendingMistake {
  wordLocation: string;
  pageNumber: number;
  surahNumber: number;
  ayahNumber: number;
  wordPosition: number;
  mistakeType: "MEMORIZATION" | "TAJWEED";
  wordText: string;
}

interface MushafAssessorProps {
  student: { id: string; name: string };
  sessionId: string;
  recitationId?: string;
  initialPage?: number;
  onSaved?: (count: number) => void;
}

export const MushafAssessor: React.FC<MushafAssessorProps> = ({
  student,
  sessionId: _sessionId,
  recitationId,
  initialPage,
  onSaved,
}) => {
  const { toast } = useToast();

  const [activeMode, setActiveMode] = useState<"MEMORIZATION" | "TAJWEED">("MEMORIZATION");
  const [pendingMistakes, setPendingMistakes] = useState<PendingMistake[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage ?? 1);
  const [showReview, setShowReview] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [pageInputVal, setPageInputVal] = useState("");

  const { data: studentState } = useStudentMushafState(student.id);
  const { data: surahs } = useSurahsWithPages();

  // Auto-resume at student's last page when no initialPage is provided
  useEffect(() => {
    if (studentState?.lastPageNumber && !initialPage) {
      setCurrentPage(studentState.lastPageNumber);
    }
  }, [studentState, initialPage]);

  const {
    data: pageData,
    isLoading,
    refetch: retryPage,
    error: pageError,
  } = useMushafPage(currentPage);

  const { data: existingMistakes } = useStudentMistakes(student.id, currentPage);
  const bulkCreate = useBulkCreateMistakes();

  // Set of pending word locations for O(1) lookup
  const selectedWords = useMemo(
    () => new Set(pendingMistakes.map((m) => m.wordLocation)),
    [pendingMistakes],
  );

  // Map of existing saved mistakes for this page
  const highlightMap = useMemo(() => {
    const map = new Map<string, "MEMORIZATION" | "TAJWEED">();
    existingMistakes?.forEach((m) =>
      map.set(m.wordLocation, m.mistakeType as "MEMORIZATION" | "TAJWEED"),
    );
    return map;
  }, [existingMistakes]);

  // Auto-close the review panel when pending list becomes empty
  useEffect(() => {
    if (pendingMistakes.length === 0) setShowReview(false);
  }, [pendingMistakes.length]);

  // Bug fix: highlightMap added to deps so the closure sees fresh existing mistakes.
  // Words already saved as mistakes are not re-added — they're already recorded.
  const handleWordTap = useCallback(
    (word: MushafWord) => {
      if (word.char_type_name === "end") return;
      const loc = word.location;

      // Don't allow re-marking a word that is already saved to the backend
      if (highlightMap.has(loc)) return;

      setPendingMistakes((prev) => {
        const idx = prev.findIndex((m) => m.wordLocation === loc);
        if (idx !== -1) return prev.filter((_, i) => i !== idx);
        const [surah = 0, ayah = 0, pos = 0] = loc.split(":").map(Number);
        return [
          ...prev,
          {
            wordLocation: loc,
            pageNumber: currentPage,
            surahNumber: surah,
            ayahNumber: ayah,
            wordPosition: pos,
            mistakeType: activeMode,
            wordText: word.text,
          },
        ];
      });
    },
    [activeMode, currentPage, highlightMap],
  );

  const goToPage = (page: number) => {
    if (page < 1 || page > 604) return;
    setCurrentPage(page);
    triggerPrefetch(page);
  };

  const handleSave = async () => {
    if (!pendingMistakes.length) return;
    const count = pendingMistakes.length;
    try {
      const payload: Parameters<typeof bulkCreate.mutateAsync>[0] = {
        studentId: student.id,
        mistakes: pendingMistakes.map((m) => ({
          wordLocation: m.wordLocation,
          pageNumber: m.pageNumber,
          surahNumber: m.surahNumber,
          ayahNumber: m.ayahNumber,
          wordPosition: m.wordPosition,
          mistakeType: m.mistakeType,
        })),
      };
      if (recitationId) payload.recitationId = recitationId;

      await bulkCreate.mutateAsync(payload);

      toast({
        title: "تم الحفظ ✓",
        description: `تم حفظ ${count} ${count === 1 ? "خطأ" : "أخطاء"} لـ ${student.name}`,
      });

      // Capture count before clearing state
      setPendingMistakes([]);
      setShowReview(false);
      onSaved?.(count);
    } catch {
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ",
        description: "فشل حفظ الأخطاء. تحقق من اتصالك وحاول مرة أخرى.",
      });
    }
  };

  const clearAllMistakes = () => {
    setPendingMistakes([]);
    // showReview auto-closes via the useEffect above
  };

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

  const jumpToPage = (val: string) => {
    const n = parseInt(val);
    if (n >= 1 && n <= 604) {
      goToPage(n);
      setShowNav(false);
      setPageInputVal("");
      setNavSearch("");
    }
  };

  // Existing mistake counts for the info bar
  const existingCounts = useMemo(() => {
    let mem = 0;
    let taj = 0;
    existingMistakes?.forEach((m) => {
      if (m.mistakeType === "MEMORIZATION") mem++;
      else taj++;
    });
    return { mem, taj, total: mem + taj };
  }, [existingMistakes]);

  return (
    <div className="relative flex-1 flex flex-col bg-background overflow-hidden" dir="rtl">

      {/* ── Toolbar ── */}
      <div className="flex-none flex items-center gap-2 px-3 py-2 border-b bg-card shadow-sm">

        {/* Mistake mode toggle */}
        <div className="flex flex-1 bg-muted rounded-xl p-1 gap-0.5">
          <button
            onClick={() => setActiveMode("MEMORIZATION")}
            className={cn(
              "flex-1 h-9 rounded-lg text-sm font-bold transition-all duration-200",
              activeMode === "MEMORIZATION"
                ? "bg-red-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="flex items-center justify-center gap-1.5">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  activeMode === "MEMORIZATION" ? "bg-white" : "bg-red-400",
                )}
              />
              حفظ
            </span>
          </button>
          <button
            onClick={() => setActiveMode("TAJWEED")}
            className={cn(
              "flex-1 h-9 rounded-lg text-sm font-bold transition-all duration-200",
              activeMode === "TAJWEED"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="flex items-center justify-center gap-1.5">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  activeMode === "TAJWEED" ? "bg-white" : "bg-amber-400",
                )}
              />
              تجويد
            </span>
          </button>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= 604}
            className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center disabled:opacity-40 hover:bg-muted/70 active:scale-95 transition-all"
            title="الصفحة التالية"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowNav(true)}
            className="h-9 min-w-[3.5rem] px-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary font-bold text-sm transition-colors"
            title="الانتقال إلى صفحة"
          >
            {currentPage}
          </button>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center disabled:opacity-40 hover:bg-muted/70 active:scale-95 transition-all"
            title="الصفحة السابقة"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Surah navigator shortcut */}
        <button
          onClick={() => setShowNav(true)}
          className="h-9 w-9 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors active:scale-95"
          title="الانتقال إلى سورة"
        >
          <BookMarked className="h-4 w-4" />
        </button>
      </div>

      {/* ── Surah + Juz + existing mistake summary ── */}
      {pageData && (
        <div className="flex-none flex items-center justify-between px-4 py-1.5 bg-primary/5 border-b gap-3">
          <span className="font-['Uthmanic'] text-base font-semibold text-primary truncate">
            سورة {pageData.topPageSurah?.name}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            {/* Existing mistake pills — visible at a glance */}
            {existingCounts.total > 0 && (
              <div className="flex items-center gap-1">
                {existingCounts.mem > 0 && (
                  <span className="inline-flex items-center gap-0.5 bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    {existingCounts.mem}
                  </span>
                )}
                {existingCounts.taj > 0 && (
                  <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {existingCounts.taj}
                  </span>
                )}
              </div>
            )}
            <span className="text-xs text-muted-foreground">الجزء {pageData.topPageJuz}</span>
          </div>
        </div>
      )}

      {/* ── Mushaf content (scrollable) ── */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <div className="flex h-full min-h-[200px] items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">جاري التحميل...</span>
          </div>
        ) : pageError ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-muted-foreground">تعذّر تحميل الصفحة</p>
            <button
              onClick={() => retryPage()}
              className="flex items-center gap-1.5 rounded-lg bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/70 transition-colors active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </button>
          </div>
        ) : pageData ? (
          <MushafPageRenderer
            page={pageData}
            interactive
            onWordTap={handleWordTap}
            selectedWords={selectedWords}
            highlightedWords={highlightMap}
          />
        ) : null}
      </div>

      {/* ── Collapsible review panel ── */}
      {showReview && pendingMistakes.length > 0 && (
        <div className="flex-none border-t flex flex-col max-h-[40vh] bg-background shadow-lg">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b">
            <span className="text-sm font-bold">
              الأخطاء المعلقة
              <span className="mr-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                {pendingMistakes.length}
              </span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={clearAllMistakes}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف الكل
              </button>
              <button
                onClick={() => setShowReview(false)}
                className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mistake list */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {pendingMistakes.map((m) => (
                <div
                  key={m.wordLocation}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Mistake type badge */}
                    <span
                      className={cn(
                        "flex-none text-[10px] font-bold px-1.5 py-0.5 rounded",
                        m.mistakeType === "MEMORIZATION"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
                      )}
                    >
                      {m.mistakeType === "MEMORIZATION" ? "حفظ" : "تجويد"}
                    </span>
                    {/* Arabic word */}
                    <span className="font-['Uthmanic'] text-lg leading-none truncate">
                      {m.wordText}
                    </span>
                    {/* Location hint */}
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums" dir="ltr">
                      {m.surahNumber}:{m.ayahNumber}:{m.wordPosition}
                    </span>
                  </div>
                  {/* Remove individual */}
                  <button
                    onClick={() =>
                      setPendingMistakes((prev) => prev.filter((x) => x.wordLocation !== m.wordLocation))
                    }
                    className="flex-none h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="إزالة"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* ── Bottom save bar ── */}
      <div className="flex-none flex items-center gap-2 px-3 py-2.5 border-t bg-card">

        {/* Undo last tap */}
        <button
          onClick={() => setPendingMistakes((prev) => prev.slice(0, -1))}
          disabled={!pendingMistakes.length}
          className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center disabled:opacity-30 hover:bg-muted/70 transition-colors active:scale-95"
          title="تراجع عن الأخير"
        >
          <Undo2 className="h-4 w-4" />
        </button>

        {/* Counter / review toggle */}
        {pendingMistakes.length > 0 ? (
          <button
            onClick={() => setShowReview((v) => !v)}
            className="h-10 px-3 rounded-xl text-sm font-bold flex items-center gap-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60 active:scale-95 transition-all"
          >
            <span className="min-w-[1.5rem] h-5 rounded-full bg-red-500 text-white text-xs font-bold inline-flex items-center justify-center px-1">
              {pendingMistakes.length}
            </span>
            {showReview ? "إخفاء" : "مراجعة"}
          </button>
        ) : (
          <div className="h-10 px-3 rounded-xl text-sm flex items-center gap-1.5 bg-muted text-muted-foreground opacity-50 select-none">
            <span className="min-w-[1.5rem] h-5 rounded-full bg-muted-foreground/20 text-xs inline-flex items-center justify-center px-1">
              0
            </span>
            أخطاء
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!pendingMistakes.length || bulkCreate.isPending}
          className={cn(
            "flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
            pendingMistakes.length && !bulkCreate.isPending
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-40",
          )}
        >
          {bulkCreate.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              حفظ الأخطاء
              {pendingMistakes.length > 0 && (
                <span className="opacity-75 font-normal text-xs">({pendingMistakes.length})</span>
              )}
            </>
          )}
        </button>
      </div>

      {/* ── Surah / Page navigator overlay ── */}
      {showNav && (
        <div className="absolute inset-0 z-40 flex flex-col bg-background">
          {/* Header */}
          <div className="flex-none flex items-center justify-between px-4 py-3 border-b bg-card shadow-sm">
            <h2 className="font-bold text-lg">الانتقال إلى</h2>
            <button
              onClick={() => {
                setShowNav(false);
                setNavSearch("");
                setPageInputVal("");
              }}
              className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
            >
              <X className="h-5 w-5" />
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
                  if (e.key === "Enter") jumpToPage(pageInputVal);
                }}
              />
              <button
                onClick={() => jumpToPage(pageInputVal)}
                disabled={
                  !pageInputVal ||
                  parseInt(pageInputVal) < 1 ||
                  parseInt(pageInputVal) > 604
                }
                className={cn(
                  "h-11 px-4 rounded-lg font-bold text-sm transition-all",
                  pageInputVal &&
                    parseInt(pageInputVal) >= 1 &&
                    parseInt(pageInputVal) <= 604
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                    : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed",
                )}
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Surah search */}
          <div className="flex-none px-4 py-2 border-b bg-card">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="ابحث في السور..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                className="h-10 pr-9"
                autoFocus
              />
            </div>
          </div>

          {/* Surah list */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {!surahs ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
                      goToPage(surah.startPage);
                      setShowNav(false);
                      setNavSearch("");
                      setPageInputVal("");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors text-right"
                  >
                    {/* Surah number badge */}
                    <div className="flex-none h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary" dir="ltr">
                      {surah.number}
                    </div>

                    {/* Surah name + transliteration */}
                    <div className="flex-1 text-right min-w-0">
                      <div className="font-['Uthmanic'] text-lg leading-tight">
                        {surah.nameArabic}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {surah.nameEnglish}
                      </div>
                    </div>

                    {/* First page chip */}
                    <div className="flex-none text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-medium tabular-nums" dir="ltr">
                      ص {surah.startPage}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
