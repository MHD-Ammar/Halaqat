"use client";

/**
 * MushafViewerPage
 *
 * Full-screen Mushaf reading experience for students.
 * Includes: Auto-resume, Swipe gestures, State saving, and Mistake highlights.
 */

import { MistakeType, tallyMistakes } from "@halaqat/types";
import { AlertCircle, ChevronLeft, ChevronRight, Search, Loader2, History } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";

import {
  MushafPageRenderer,
  MushafPageHeader,
  StudentMistakeSummary,
  PageHistorySheet,
} from "@/components/mushaf";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMushafPage,
  useMyMushafState,
  useUpdateMyMushafState,
  useStudentMistakes,
  usePageRecitationHistory,
  triggerPrefetch,
} from "@/hooks/use-mushaf";
import { useStudentPortal } from "@/hooks/use-student-portal";
import { useSurahsWithPages, findSurahForPage } from "@/hooks/use-surahs-with-pages";

export default function MushafViewerPage() {
  const { studentId } = useStudentPortal();

  // 1. Initial state from backend
  const { data: mushafState, isLoading: isStateLoading } = useMyMushafState();

  // 2. Local View State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [initialized, setInitialized] = useState(false);
  const [showJumpDialog, setShowJumpDialog] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState("");
  const [showSurahPicker, setShowSurahPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // 3. Set initial page from backend state
  useEffect(() => {
    if (mushafState && !initialized) {
      setCurrentPage(mushafState.lastPageNumber);
      setInitialized(true);
    }
  }, [mushafState, initialized]);

  // 4. Fetch page data from QuraniHub
  const {
    data: pageData,
    isLoading: isPageLoading,
    error: pageError,
    refetch: retryFetchPage,
  } = useMushafPage(currentPage);

  // 5. Fetch mistakes for this page — latest attempt only, so re-recited
  // pages show the newest attempt rather than every attempt merged.
  const { data: mistakes } = useStudentMistakes(
    studentId || "",
    currentPage,
    true,
  );

  // 5b. Page history — drives the history button visibility (hidden when the
  // page has never been recited) and is reused by the history panel.
  const { data: pageHistory } = usePageRecitationHistory(
    studentId || "",
    currentPage,
  );
  const hasHistory = (pageHistory?.length ?? 0) > 0;

  // 6. Fetch surahs for the picker
  const { data: surahList } = useSurahsWithPages();

  // 7. Convert mistakes to highlight map
  const highlightMap = useMemo(() => {
    const map = new Map<string, MistakeType>();
    if (mistakes) {
      for (const m of mistakes) {
        map.set(m.wordLocation, m.mistakeType);
      }
    }
    return map;
  }, [mistakes]);

  // 7b. Per-type counts for the student summary bar.
  const mistakeCounts = useMemo(
    () => tallyMistakes(mistakes ?? []),
    [mistakes],
  );

  // 8. State saving logic
  const updateStateMutation = useUpdateMyMushafState();
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveState = useCallback(
    (page: number) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updateStateMutation.mutate({ pageNumber: page });
      }, 500);
    },
    [updateStateMutation]
  );

  // 9. Navigation Helpers
  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > 604) return;
      setCurrentPage(page);
      saveState(page);
      triggerPrefetch(page);
    },
    [saveState]
  );

  // 10. Swipe Handling
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!e.changedTouches[0]) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Threshold 50px, horizontal only
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    // Mushaf (RTL): Swipe RIGHT (positive deltaX) = Higher page index (Next page)
    // Swipe LEFT (negative deltaX) = Lower page index (Previous page)
    if (deltaX > 0) {
      goToPage(currentPage + 1);
    } else {
      goToPage(currentPage - 1);
    }
  };

  // 11. Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showJumpDialog || showSurahPicker) return;
      // Arabic / Mushaf RTL: the right arrow leafs *backward* (lower page
      // number) and the left arrow leafs *forward*, matching how a physical
      // Mushaf is turned.
      if (e.key === "ArrowRight") goToPage(currentPage - 1);
      if (e.key === "ArrowLeft") goToPage(currentPage + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, goToPage, showJumpDialog, showSurahPicker]);

  // 12. UI Calculations
  const currentSurah = findSurahForPage(surahList, currentPage);

  if (isStateLoading && !initialized) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-medium text-muted-foreground italic">جاري تحميل المصحف...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">عذراً، حدث خطأ أثناء تحميل الصفحة</h3>
          <p className="text-muted-foreground">تأكد من اتصالك بالإنترنت وحاول مرة أخرى</p>
        </div>
        <Button onClick={() => retryFetchPage()} className="px-8">
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Header ── */}
      <MushafPageHeader
        surahName={currentSurah?.nameArabic || pageData?.topPageSurah.name || "..."}
        surahEnglishName={currentSurah?.nameEnglish || pageData?.topPageSurah.englishName || "..."}
        pageNumber={currentPage}
        juzNumber={pageData?.topPageJuz || 1}
        className="sticky top-0 z-40 shadow-sm"
      />

      {/* ── Main Content Area ── */}
      <main
        className="relative flex-1 overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isPageLoading ? (
          <div className="mx-auto max-w-2xl space-y-4 p-8">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <div className="grid grid-cols-1 gap-6">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        ) : pageData ? (
          <div className="animate-in fade-in duration-500">
            <MushafPageRenderer
              page={pageData}
              highlightedWords={highlightMap}
              interactive={false}
            />
          </div>
        ) : null}

        {/* ── Floating Mistake Summary ── */}
        {/* Shows the student a per-type breakdown of the mistakes their
            teacher marked on this page. bottom-36 clears both the sticky nav
            footer (~52px) and the fixed bottom nav (64px). */}
        {mistakes && mistakes.length > 0 && (
          <div className="fixed bottom-36 inset-x-0 flex justify-center z-30 px-4 animate-in slide-in-from-bottom-4">
            <StudentMistakeSummary counts={mistakeCounts} />
          </div>
        )}
      </main>

      {/* ── Navigation Footer ── */}
      <div className="sticky bottom-16 inset-x-0 bg-background/95 backdrop-blur-md border-t p-2 z-40 transition-transform md:bottom-0">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            title="الصفحة السابقة"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <div className="flex items-center gap-2">
            {/* Jump to Page Dialog */}
            <Dialog open={showJumpDialog} onOpenChange={setShowJumpDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="font-bold min-w-[100px]">
                  {currentPage} / 604
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[300px] sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-center">انتقل إلى صفحة</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <Input
                    type="number"
                    placeholder="رقم الصفحة (1-604)"
                    className="text-center text-lg"
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    min={1}
                    max={604}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const p = parseInt(jumpPageInput);
                        if (p >= 1 && p <= 604) {
                          goToPage(p);
                          setShowJumpDialog(false);
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const p = parseInt(jumpPageInput);
                      if (p >= 1 && p <= 604) {
                        goToPage(p);
                        setShowJumpDialog(false);
                      }
                    }}
                  >
                    انتقل
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Recitation history — only shown once the page has been recited
                at least once, otherwise there is nothing to show. */}
            {hasHistory && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(true)}
                title="سجل التسميع"
                aria-label="سجل التسميع"
              >
                <History className="h-5 w-5" />
              </Button>
            )}

            {/* Surah Picker Dialog */}
            <Dialog open={showSurahPicker} onOpenChange={setShowSurahPicker}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-4 border-b">
                  <DialogTitle className="text-center">اختر السورة</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto p-4 flex-1">
                  <div className="grid grid-cols-2 gap-2">
                    {surahList?.map((surah) => (
                      <Button
                        key={surah.number}
                        variant="outline"
                        className="justify-between h-auto py-3 px-4 font-['Uthmanic'] text-lg"
                        onClick={() => {
                          goToPage(surah.startPage);
                          setShowSurahPicker(false);
                        }}
                      >
                        <span className="text-muted-foreground text-xs opacity-50">
                          {surah.number}
                        </span>
                        <span>{surah.nameArabic}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= 604}
            title="الصفحة التالية"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Recitation history panel for the current page */}
      {studentId && (
        <PageHistorySheet
          open={showHistory}
          onOpenChange={setShowHistory}
          studentId={studentId}
          pageNumber={currentPage}
        />
      )}
    </div>
  );
}
