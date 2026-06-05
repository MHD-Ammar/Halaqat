"use client";

/**
 * MushafAssessor — orchestrator only (≤ 200 lines).
 *
 * State lives in focused hooks; JSX lives in focused child components.
 * Nothing in this file handles business logic directly.
 *
 * Gesture flow (unchanged):
 *  1. Long-press a word → radial picker opens.
 *  2. Drag toward a mistake type, release → pending mistake recorded.
 *  3. Navigate pages, mark more mistakes.
 *  4. "حفظ الأخطاء" → bulk-save, state cleared.
 */

import {
  MistakeType,
  RecitationQuality,
  averagePageScores,
  calculatePageScore,
  tallyMistakes,
} from "@halaqat/types";
import type { MushafWord, PageScoreResult } from "@halaqat/types";
import { Loader2, RefreshCw } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import {
  triggerPrefetch,
  useBulkCreateMistakes,
  useMushafPage,
  useStudentMistakes,
  useStudentMushafState,
  useUpdateStudentMushafState,
} from "@/hooks/use-mushaf";
import { useSurahsWithPages } from "@/hooks/use-surahs-with-pages";
import { useToast } from "@/hooks/use-toast";

import { useMushafKeyboard } from "./hooks/useMushafKeyboard";
import { usePendingMistakes } from "./hooks/usePendingMistakes";
import { LiveScoreHeader } from "./LiveScoreHeader";
import { MISTAKE_TYPES_IN_ORDER } from "./mistake-style";
import { MushafPageRenderer, type WordPointerEvent } from "./MushafPageRenderer";
import { AssessorToolbar } from "./parts/AssessorToolbar";
import { PendingMistakesPanel } from "./parts/PendingMistakesPanel";
import { SaveBar } from "./parts/SaveBar";
import { SurahSearchSheet } from "./parts/SurahSearchSheet";
import { QualityOverridePicker } from "./QualityOverridePicker";
import { RadialMistakePicker } from "./RadialMistakePicker";
import { usePageSwipe } from "./use-page-swipe";
import { useRadialPicker } from "./use-radial-picker";

// ── Arabic plural rules for mistake count ─────────────────────────────────
// Arabic has six grammatical number forms; the practical cases for UI counts:
//   0       → "أخطاء"   (treated as plural)
//   1       → "خطأ"     (singular)
//   2       → "خطأين"   (dual)
//   3–10    → "أخطاء"   (sound masculine plural / جمع قلة)
//   11+     → "خطأ"     (broken plural / جمع كثرة — same word as singular)
function formatMistakeCount(count: number): string {
  if (count === 1) return "خطأ";
  if (count === 2) return "خطأين";
  if (count >= 3 && count <= 10) return "أخطاء";
  return "خطأ"; // 0 and 11+
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
  const { onError: onSaveError } = useApiErrorToast();
  const [currentPage, setCurrentPage] = useState(initialPage ?? 1);
  const [showReview, setShowReview] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [defaultMistakeType, setDefaultMistakeType] = useState<MistakeType>(
    MistakeType.MEMORIZATION,
  );
  const [qualityOverridesByPage, setQualityOverridesByPage] = useState<
    Record<number, RecitationQuality | null>
  >({});

  const { data: studentState } = useStudentMushafState(student.id);
  const { data: surahs } = useSurahsWithPages();
  const updateStudentState = useUpdateStudentMushafState();
  const { data: pageData, isLoading, refetch: retryPage, error: pageError } =
    useMushafPage(currentPage);
  const { data: existingMistakes } = useStudentMistakes(student.id, currentPage);
  const bulkCreate = useBulkCreateMistakes();

  // Auto-resume last reading position (initialPage wins).
  // We store initialPage in a ref so the effect's dep-array stays accurate
  // without re-running every time the prop value changes (it's stable at mount).
  const initialPageRef = useRef(initialPage);
  useEffect(() => {
    if (initialPageRef.current || !studentState?.lastPageNumber) return;
    setCurrentPage((p) => (p === 1 ? studentState.lastPageNumber : p));
  }, [studentState]);

  const savedHighlightMap = useMemo(() => {
    const map = new Map<string, MistakeType>();
    existingMistakes?.forEach((m) => map.set(m.wordLocation, m.mistakeType));
    return map;
  }, [existingMistakes]);

  const savedWordLocations = useMemo<ReadonlySet<string>>(
    () => new Set(savedHighlightMap.keys()),
    [savedHighlightMap],
  );

  const pending = usePendingMistakes({ currentPage, savedWordLocations });

  // Auto-close review when all pending cleared.
  useEffect(() => {
    if (pending.totalCount === 0) setShowReview(false);
  }, [pending.totalCount]);

  const combinedHighlightMap = useMemo(() => {
    const map = new Map<string, MistakeType>(savedHighlightMap);
    pending.pendingForPage.forEach((m) => map.set(m.wordLocation, m.mistakeType));
    return map;
  }, [savedHighlightMap, pending.pendingForPage]);

  const liveCounts = useMemo(
    () =>
      tallyMistakes([
        ...(existingMistakes ?? []).map((m) => ({ mistakeType: m.mistakeType })),
        ...pending.pendingForPage,
      ]),
    [existingMistakes, pending.pendingForPage],
  );
  const liveResult = useMemo<PageScoreResult>(
    () => calculatePageScore(liveCounts),
    [liveCounts],
  );
  const sessionResult = useMemo<PageScoreResult | null>(() => {
    const pages = new Set([
      ...Object.keys(pending.pendingMistakesByPage).map(Number),
      currentPage,
    ]);
    const results = Array.from(pages)
      .filter((p) => (pending.pendingMistakesByPage[p]?.length ?? 0) > 0 || p === currentPage)
      .map((p) => {
        const pp = pending.pendingMistakesByPage[p] ?? [];
        const saved = p === currentPage
          ? (existingMistakes ?? []).map((m) => ({ mistakeType: m.mistakeType }))
          : [];
        return calculatePageScore(tallyMistakes([...saved, ...pp]));
      });
    return results.length > 1 ? averagePageScores(results) : null;
  }, [pending.pendingMistakesByPage, existingMistakes, currentPage]);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > 604) return;
      setCurrentPage(page);
      triggerPrefetch(page);
      updateStudentState.mutate({ studentId: student.id, pageNumber: page });
    },
    [student.id, updateStudentState],
  );

  const radial = useRadialPicker<MistakeType, MushafWord>({
    onSelect: (word, type) => {
      pending.toggleWord(word, type, currentPage);
      setDefaultMistakeType(type);
      setQualityOverridesByPage((prev) => {
        if (!(currentPage in prev)) return prev;
        const next = { ...prev };
        delete next[currentPage];
        return next;
      });
    },
    onQuickTap: (word) => pending.toggleWord(word, defaultMistakeType, currentPage),
  });

  const handleWordPointerDown = useCallback(
    (e: WordPointerEvent) => {
      if (savedHighlightMap.has(e.word.location)) return;
      radial.beginGesture({
        payload: e.word,
        items: MISTAKE_TYPES_IN_ORDER,
        anchor: { x: e.anchorX, y: e.anchorY },
        pointer: { x: e.pointerX, y: e.pointerY },
        pointerId: e.pointerId,
        capturingElement: e.element,
      });
    },
    [radial, savedHighlightMap],
  );

  const swipeHandlers = usePageSwipe({
    isBlocked: radial.state !== null,
    onSwipePrev: () => goToPage(currentPage - 1),
    onSwipeNext: () => goToPage(currentPage + 1),
  });

  const allPendingFlat = useMemo(
    () => Object.values(pending.pendingMistakesByPage).flat(),
    [pending.pendingMistakesByPage],
  );

  async function handleSave() {
    if (allPendingFlat.length === 0) return;
    try {
      await bulkCreate.mutateAsync({
        studentId: student.id,
        ...(recitationId ? { recitationId } : {}),
        mistakes: allPendingFlat.map(({ wordLocation, pageNumber, surahNumber, ayahNumber, wordPosition, mistakeType }) => ({
          wordLocation, pageNumber, surahNumber, ayahNumber, wordPosition, mistakeType,
        })),
      });
      const count = allPendingFlat.length;
      toast({ title: "تم الحفظ ✓", description: `تم حفظ ${count} ${formatMistakeCount(count)} لـ ${student.name}` });
      pending.clearAll();
      setQualityOverridesByPage({});
      setShowReview(false);
      onSaved?.(count);
    } catch (error) {
      // useApiErrorToast extracts Arabic message from ApiError or falls back gracefully
      onSaveError(error);
    }
  }

  useMushafKeyboard({
    onPrevPage: () => goToPage(currentPage - 1),
    onNextPage: () => goToPage(currentPage + 1),
    onSetMode: setDefaultMistakeType,
    onUndo: () => pending.undoLastOnPage(currentPage),
    onSave: handleSave,
    onCloseAllDrawers: () => { setShowReview(false); setShowNav(false); },
    onOpenPageJump: () => setShowNav(true),
    enabled: !showNav,
  });

  const pageHasAnyMistake = Object.values(liveCounts).some((v) => v > 0);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background" dir="rtl" role="region" aria-label="مُقيّم المصحف">
      <AssessorToolbar
        currentPage={currentPage}
        {...(pageData?.topPageSurah?.name ? { surahName: pageData.topPageSurah.name } : {})}
        onPrevPage={() => goToPage(currentPage - 1)}
        onNextPage={() => goToPage(currentPage + 1)}
        onOpenNav={() => setShowNav(true)}
      />
      <LiveScoreHeader counts={liveCounts} result={liveResult} overrideQuality={qualityOverridesByPage[currentPage] ?? null} className="flex-none" />

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y" onTouchStart={swipeHandlers.onTouchStart} onTouchEnd={swipeHandlers.onTouchEnd}>
        {isLoading ? (
          <div className="flex h-full min-h-[200px] items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">جاري التحميل...</span></div>
        ) : pageError ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-muted-foreground">تعذّر تحميل الصفحة</p>
            <button onClick={() => retryPage()} className="flex items-center gap-1.5 rounded-lg bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/70 transition-colors active:scale-95"><RefreshCw className="h-4 w-4" />إعادة المحاولة</button>
          </div>
        ) : pageData ? (
          <MushafPageRenderer
            page={pageData}
            interactive
            onWordPointerDown={handleWordPointerDown}
            selectedWords={pending.selectedWordLocations}
            highlightedWords={combinedHighlightMap}
          />
        ) : null}
      </div>

      {pageHasAnyMistake && <QualityOverridePicker suggested={liveResult.suggestedQuality} override={qualityOverridesByPage[currentPage] ?? null} onChange={(next) => setQualityOverridesByPage((prev) => ({ ...prev, [currentPage]: next }))} className="flex-none mx-3 mb-1" />}

      <PendingMistakesPanel open={showReview} pendingMistakesByPage={pending.pendingMistakesByPage} pendingForPage={pending.pendingForPage} totalCount={pending.totalCount} currentPage={currentPage} onClose={() => setShowReview(false)} onRemove={(loc, page) => pending.removeByLocation(loc, page)} onClearPage={(page) => pending.clearPage(page)} />

      <SaveBar totalCount={pending.totalCount} pendingOnPageCount={pending.pendingForPage.length} isSaving={bulkCreate.isPending} reviewOpen={showReview} pagesWithMistakesCount={Object.values(pending.pendingMistakesByPage).filter((l) => l.length > 0).length} onUndo={() => pending.undoLastOnPage(currentPage)} onToggleReview={() => setShowReview((v) => !v)} onSave={handleSave} />

      {sessionResult && Object.keys(pending.pendingMistakesByPage).length > 1 && (
        <div className="hidden sm:flex absolute bottom-16 left-3 h-10 px-3 rounded-xl text-xs items-center gap-1.5 bg-primary/10 text-primary pointer-events-none">
          <span className="opacity-70">جلسة</span>
          <span className="font-black tabular-nums">{sessionResult.score.toFixed(1)}</span>
        </div>
      )}

      <SurahSearchSheet open={showNav} surahs={surahs} onClose={() => setShowNav(false)} onSelectPage={(page) => { goToPage(page); setShowNav(false); }} />

      {radial.state && <RadialMistakePicker anchor={radial.state.anchor} items={radial.state.items} activeIndex={radial.state.activeIndex} />}
    </div>
  );
};
