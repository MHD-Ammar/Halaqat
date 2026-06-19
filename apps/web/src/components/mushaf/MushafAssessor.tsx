"use client";

/**
 * MushafAssessor
 *
 * Teacher-facing Mushaf workspace. Combines:
 *  - Page renderer with word-level long-press → radial-picker selection
 *  - Live score header that grades each page out of 10 in real time
 *  - Per-page quality auto-suggest with teacher override
 *  - Surah / page navigator overlay
 *  - Pending mistake review list
 *  - Bulk save against a single recitation row
 *
 * Gesture flow
 * ------------
 *  1. Teacher long-presses a word.
 *  2. `useRadialPicker` opens the {@link RadialMistakePicker}.
 *  3. Teacher drags toward a mistake type (حفظ / تجويد / تشكيل) and releases.
 *  4. The mistake is added to the pending list for that page.
 *  5. Live score header recomputes; quality auto-suggest updates.
 *  6. Teacher can per-page override the quality, then "حفظ الأخطاء".
 *
 * Quick tap (release before the long-press fires) ⇒ uses the *most recent*
 * radial choice as the default mistake type. We deliberately avoid having a
 * separate "active mode toggle" — the radial picker IS the mode picker, and
 * the most recent choice is remembered as the implicit default. This keeps
 * the teacher's hands on the page rather than reaching for a toolbar.
 */

import {
  MistakeType,
  RecitationQuality,
  RecitationType,
  calculatePageScore,
  averagePageScores,
  tallyMistakes,
} from "@halaqat/types";
import type {
  MushafWord,
  PageScoreResult,
  MistakeCounts,
} from "@halaqat/types";
import {
  BookMarked,
  Check,
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  triggerPrefetch,
  usePageRecitationHistory,
  useRecordMushafAssessment,
  useMushafPage,
  useStudentMistakes,
  useStudentMushafState,
  useUpdateStudentMushafState,
} from "@/hooks/use-mushaf";
import { useSurahsWithPages } from "@/hooks/use-surahs-with-pages";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

import { LiveScoreHeader } from "./LiveScoreHeader";
import {
  MISTAKE_TYPES_IN_ORDER,
  getMistakeStyle,
} from "./mistake-style";
import {
  MushafPageRenderer,
  type WordPointerEvent,
} from "./MushafPageRenderer";
import { PageHistorySheet } from "./PageHistorySheet";
import { QualityOverridePicker } from "./QualityOverridePicker";
import { RadialMistakePicker } from "./RadialMistakePicker";
import { usePageSwipe } from "./use-page-swipe";
import { useRadialPicker } from "./use-radial-picker";

// ── Local types ────────────────────────────────────────────────────────

/**
 * In-memory representation of a mistake the teacher has marked but not yet
 * saved. The shape mirrors the bulk-create DTO so we can pass the array
 * straight to the mutation.
 */
interface PendingMistake {
  wordLocation: string;
  pageNumber: number;
  surahNumber: number;
  ayahNumber: number;
  wordPosition: number;
  mistakeType: MistakeType;
  /** Cached for the review list — saves us hitting the page lookup twice. */
  wordText: string;
}

interface MushafAssessorProps {
  student: { id: string; name: string };
  sessionId: string;
  /**
   * Optional recitation row to attach the saved mistakes to. When provided,
   * mistakes are linked to that recitation; when omitted (e.g. ad-hoc
   * tagging) the recitation_id stays null.
   */
  recitationId?: string;
  /** Forces an initial page; otherwise we resume from `studentState`. */
  initialPage?: number;
  /**
   * Called after a successful bulk save with the number of mistakes saved.
   * Useful for the parent (e.g. action sheet) to react.
   */
  onSaved?: (count: number) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────

/** Arabic labels for each quality bucket (read-only display on locked pages). */
const QUALITY_LABEL_AR: Record<string, string> = {
  EXCELLENT: "ممتاز",
  VERY_GOOD: "جيد جداً",
  GOOD: "جيد",
  ACCEPTABLE: "مقبول",
  POOR: "إعادة",
};

/** Text colour per quality bucket, matching the live score header palette. */
const QUALITY_COLOR_AR: Record<string, string> = {
  EXCELLENT: "text-emerald-600 dark:text-emerald-400",
  VERY_GOOD: "text-green-600 dark:text-green-400",
  GOOD: "text-blue-600 dark:text-blue-400",
  ACCEPTABLE: "text-amber-600 dark:text-amber-400",
  POOR: "text-red-600 dark:text-red-400",
};

/**
 * Parse a wordLocation string ("surah:ayah:position") into integer parts,
 * with safe fallbacks for malformed values (defensive against API drift).
 */
function parseLocation(location: string): {
  surah: number;
  ayah: number;
  position: number;
} {
  const [surah = 0, ayah = 0, position = 0] = location.split(":").map(Number);
  return {
    surah: Number.isFinite(surah) ? surah : 0,
    ayah: Number.isFinite(ayah) ? ayah : 0,
    position: Number.isFinite(position) ? position : 0,
  };
}

// ── Component ──────────────────────────────────────────────────────────

export const MushafAssessor: React.FC<MushafAssessorProps> = ({
  student,
  sessionId,
  recitationId: _recitationId,
  initialPage,
  onSaved,
}) => {
  const { toast } = useToast();
  const tErr = useTranslations("ApiErrors");

  /**
   * Lesson type **per page**. Mirrors `pendingMistakesByPage` /
   * `qualityOverridesByPage` so a multi-page save stamps each page with its
   * own type rather than the last-visited page's. The default for a page is
   * derived from its history (see the effect below): a first-ever recitation
   * is NEW_LESSON (حفظ جديد), an already-recited page is REVIEW (مراجعة). A
   * manual pick simply overwrites that page's entry.
   */
  const [lessonTypeByPage, setLessonTypeByPage] = useState<
    Record<number, RecitationType>
  >({});

  // ── Page navigation state ────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(initialPage ?? 1);
  const [showReview, setShowReview] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [pageInputVal, setPageInputVal] = useState("");

  /**
   * Set of pages the teacher has chosen to "re-recite". While a page is in
   * this set, its previously-saved mistakes are treated as a faded backdrop
   * and no longer lock the words — so the teacher can mark a brand-new attempt
   * cleanly. Saving creates a fresh recitation; the old attempt stays in the
   * history. Cleared on save.
   */
  const [reRecitePages, setReRecitePages] = useState<Set<number>>(
    () => new Set(),
  );

  /**
   * Pending mistakes are keyed by page so the teacher can mark errors on
   * page 5, swipe to page 6 to mark more, then come back to page 5 without
   * losing the earlier ones. Saving flushes everything in one bulk request.
   */
  const [pendingMistakesByPage, setPendingMistakesByPage] = useState<
    Record<number, PendingMistake[]>
  >({});

  /**
   * Per-page teacher override of the auto-suggested quality. `null` (or
   * missing key) ⇒ use the auto-suggestion. Cleared after a successful
   * save.
   */
  const [qualityOverridesByPage, setQualityOverridesByPage] = useState<
    Record<number, RecitationQuality | null>
  >({});

  /**
   * The most recent mistake type the teacher has used. Quick taps (without
   * triggering the radial) reuse this as a sensible default. Initialised to
   * MEMORIZATION because in practice it is the most common mistake type.
   */
  const [defaultMistakeType, setDefaultMistakeType] = useState<MistakeType>(
    MistakeType.MEMORIZATION,
  );

  // ── Backend data ────────────────────────────────────────────────────
  const { data: studentState } = useStudentMushafState(student.id);
  const { data: surahs } = useSurahsWithPages();
  const updateStudentState = useUpdateStudentMushafState();

  /**
   * Auto-resume on the student's last reading position the first time we
   * see the state. `initialPage` always wins so callers can force a page.
   */
  useEffect(() => {
    if (initialPage) return;
    if (!studentState?.lastPageNumber) return;
    setCurrentPage((prev) =>
      // Only override if the user has not already navigated away from page 1.
      prev === 1 ? studentState.lastPageNumber : prev,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentState]);

  const {
    data: pageData,
    isLoading,
    refetch: retryPage,
    error: pageError,
  } = useMushafPage(currentPage);

  // Latest attempt's mistakes for the current page (the saved overlay).
  const { data: existingMistakes } = useStudentMistakes(
    student.id,
    currentPage,
    true,
  );

  // Always-on history fetch for the current page — used to detect whether a
  // saved attempt exists even when the student recited perfectly (zero
  // mistakes), to drive the lesson-type default, and to lock editing.
  const { data: pageHistory } = usePageRecitationHistory(student.id, currentPage);

  /** Whether the current page already has a saved attempt. */
  const hasSavedAttempt = (pageHistory?.length ?? 0) > 0;

  /** True while the current page is being re-recited as a fresh attempt. */
  const isReReciting = reRecitePages.has(currentPage);

  /**
   * A page that already has a saved attempt is READ-ONLY by default: the
   * teacher cannot quietly append mistakes to (and thereby re-score) the
   * existing attempt. To make changes they must explicitly start a fresh
   * attempt via "إعادة تسميع", which records a new recitation and keeps the
   * old one in the history.
   */
  const pageLocked = hasSavedAttempt && !isReReciting;

  /**
   * Effective lesson type for the page on screen: the stored per-page value if
   * present, otherwise the history-derived default (REVIEW for a page with a
   * saved attempt, NEW_LESSON for a fresh one).
   */
  const currentLessonType =
    lessonTypeByPage[currentPage] ??
    (hasSavedAttempt ? RecitationType.REVIEW : RecitationType.NEW_LESSON);

  /** Manual pick — stored against the current page. */
  const chooseLessonType = useCallback(
    (next: RecitationType) => {
      setLessonTypeByPage((prev) => ({ ...prev, [currentPage]: next }));
    },
    [currentPage],
  );

  const assessMushaf = useRecordMushafAssessment();

  // ── Derived: page-level mistake set + map ────────────────────────────

  /** Pending mistakes for the page currently on screen. */
  const pendingForPage = useMemo<PendingMistake[]>(
    () => pendingMistakesByPage[currentPage] ?? [],
    [pendingMistakesByPage, currentPage],
  );

  /** Set of pending word locations for O(1) selected-state lookup. */
  const selectedWords = useMemo(
    () => new Set(pendingForPage.map((m) => m.wordLocation)),
    [pendingForPage],
  );

  /**
   * Map of saved mistakes for this page, keyed by wordLocation. While
   * re-reciting we treat the page as blank (empty map) so the previously
   * saved words no longer lock — the teacher marks a clean new attempt and
   * the old one is preserved in the history.
   */
  const savedHighlightMap = useMemo(() => {
    const map = new Map<string, MistakeType>();
    if (isReReciting) return map;
    existingMistakes?.forEach((m) => map.set(m.wordLocation, m.mistakeType));
    return map;
  }, [existingMistakes, isReReciting]);

  /**
   * Combined highlight map (saved + pending) used by the renderer so the
   * teacher sees the mistake type's colour the moment they release the
   * picker, not only after the bulk save.
   */
  const combinedHighlightMap = useMemo(() => {
    const map = new Map<string, MistakeType>(savedHighlightMap);
    for (const m of pendingForPage) {
      map.set(m.wordLocation, m.mistakeType);
    }
    return map;
  }, [savedHighlightMap, pendingForPage]);

  /**
   * Tally pending + saved counts → score for the live header. During a
   * re-recite the saved attempt is excluded so the score reflects only the
   * fresh attempt being marked.
   */
  const liveCounts = useMemo<MistakeCounts>(() => {
    return tallyMistakes([
      ...(isReReciting
        ? []
        : (existingMistakes ?? []).map((m) => ({ mistakeType: m.mistakeType }))),
      ...pendingForPage,
    ]);
  }, [existingMistakes, pendingForPage, isReReciting]);

  const liveResult = useMemo<PageScoreResult>(
    () => calculatePageScore(liveCounts),
    [liveCounts],
  );

  /**
   * Aggregate score across every page that has any pending mistakes plus
   * the current page's saved counts. Used for the bottom "session" pill.
   */
  const sessionResult = useMemo<PageScoreResult | null>(() => {
    const allTouchedPages = new Set<number>();
    for (const p of Object.keys(pendingMistakesByPage)) {
      const n = Number(p);
      if ((pendingMistakesByPage[n]?.length ?? 0) > 0) allTouchedPages.add(n);
    }
    allTouchedPages.add(currentPage);

    const perPageResults: PageScoreResult[] = [];
    for (const p of allTouchedPages) {
      const pagePending = pendingMistakesByPage[p] ?? [];
      // Saved mistakes for off-screen pages are not in cache; we factor in
      // saved mistakes only for the *current* page where we have them
      // loaded. The session score is therefore an estimate when pending
      // mistakes exist on multiple pages.
      const saved =
        p === currentPage
          ? (existingMistakes ?? []).map((m) => ({
              mistakeType: m.mistakeType,
            }))
          : [];
      perPageResults.push(
        calculatePageScore(tallyMistakes([...saved, ...pagePending])),
      );
    }
    return averagePageScores(perPageResults);
  }, [pendingMistakesByPage, existingMistakes, currentPage]);

  // Auto-close review panel when nothing pending.
  useEffect(() => {
    const total = Object.values(pendingMistakesByPage).reduce(
      (sum, arr) => sum + arr.length,
      0,
    );
    if (total === 0 && showReview) setShowReview(false);
  }, [pendingMistakesByPage, showReview]);

  // ── Mistake mutation helpers ─────────────────────────────────────────

  /**
   * Toggle a mistake on a word: if a pending mistake of any type exists at
   * that location, remove (same type) or replace (different type);
   * otherwise add a new one with `type`.
   */
  const toggleMistake = useCallback(
    (word: MushafWord, type: MistakeType) => {
      // Words already saved cannot be re-marked from this surface — the
      // teacher should delete the existing record from the review list (or
      // through the API) instead.
      if (savedHighlightMap.has(word.location)) return;
      if (word.char_type_name === "end") return;

      const { surah, ayah, position } = parseLocation(word.location);

      setPendingMistakesByPage((prev) => {
        const existing = prev[currentPage] ?? [];
        const idx = existing.findIndex(
          (m) => m.wordLocation === word.location,
        );
        if (idx !== -1) {
          const cur = existing[idx];
          if (!cur) return prev;
          if (cur.mistakeType === type) {
            return {
              ...prev,
              [currentPage]: existing.filter((_, i) => i !== idx),
            };
          }
          const next = [...existing];
          next[idx] = { ...cur, mistakeType: type };
          return { ...prev, [currentPage]: next };
        }

        return {
          ...prev,
          [currentPage]: [
            ...existing,
            {
              wordLocation: word.location,
              pageNumber: currentPage,
              surahNumber: surah,
              ayahNumber: ayah,
              wordPosition: position,
              mistakeType: type,
              wordText: word.text,
            },
          ],
        };
      });

      setDefaultMistakeType(type);

      // Drop any quality override on this page when the underlying counts
      // change so the suggestion gets a fresh look. The teacher can re-set
      // it after they finish marking.
      setQualityOverridesByPage((prev) => {
        if (!(currentPage in prev)) return prev;
        const next = { ...prev };
        delete next[currentPage];
        return next;
      });
    },
    [currentPage, savedHighlightMap],
  );

  // ── Radial picker integration ────────────────────────────────────────

  const radial = useRadialPicker<MistakeType, MushafWord>({
    onSelect: (word, type) => {
      toggleMistake(word, type);
    },
    onQuickTap: (word) => {
      toggleMistake(word, defaultMistakeType);
    },
  });

  const handleWordPointerDown = useCallback(
    (e: WordPointerEvent) => {
      // A page with a saved attempt is read-only until the teacher starts a
      // re-recite, so marking is disabled entirely here.
      if (pageLocked) return;
      // Tapping a saved mistake is a no-op; we still cancel the system
      // long-press menu via the renderer's onContextMenu.
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
    [radial, savedHighlightMap, pageLocked],
  );

  /**
   * Seed the current page's default lesson type from its history, once that
   * history resolves: first-ever recitation ⇒ NEW_LESSON (حفظ جديد), an
   * already-recited page ⇒ REVIEW (مراجعة). We only write when the page has
   * no entry yet, so a manual pick (which writes an entry) is never clobbered.
   */
  useEffect(() => {
    if (pageHistory === undefined) return; // wait for history to load
    setLessonTypeByPage((prev) => {
      if (currentPage in prev) return prev; // manual or already-seeded
      return {
        ...prev,
        [currentPage]: hasSavedAttempt
          ? RecitationType.REVIEW
          : RecitationType.NEW_LESSON,
      };
    });
  }, [pageHistory, hasSavedAttempt, currentPage]);

  /** Start a fresh attempt on the current page (unlocks the saved words). */
  const startReRecite = useCallback(() => {
    setReRecitePages((prev) => {
      const next = new Set(prev);
      next.add(currentPage);
      return next;
    });
    // Drop any pending marks/override on the page so the new attempt is clean.
    setPendingMistakesByPage((prev) => {
      if (!(currentPage in prev)) return prev;
      const copy = { ...prev };
      delete copy[currentPage];
      return copy;
    });
    setQualityOverridesByPage((prev) => {
      if (!(currentPage in prev)) return prev;
      const copy = { ...prev };
      delete copy[currentPage];
      return copy;
    });
  }, [currentPage]);

  /** Cancel a re-recite, restoring the saved attempt as the overlay. */
  const cancelReRecite = useCallback(() => {
    setReRecitePages((prev) => {
      const next = new Set(prev);
      next.delete(currentPage);
      return next;
    });
    setPendingMistakesByPage((prev) => {
      if (!(currentPage in prev)) return prev;
      const copy = { ...prev };
      delete copy[currentPage];
      return copy;
    });
  }, [currentPage]);

  // ── Page navigation ──────────────────────────────────────────────────

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > 604) return;
      setCurrentPage(page);
      triggerPrefetch(page);
      // Keep the student's "last page" pointer fresh so a subsequent
      // session resumes here.
      updateStudentState.mutate({
        studentId: student.id,
        pageNumber: page,
      });
    },
    [student.id, updateStudentState],
  );

  /**
   * Horizontal swipe on the mushaf body navigates between pages. The
   * gesture is suppressed while the radial picker is active and ignored
   * for touches that started on a word — those belong to the picker.
   */
  const swipeHandlers = usePageSwipe({
    isBlocked: radial.state !== null,
    onSwipePrev: () => goToPage(currentPage - 1),
    onSwipeNext: () => goToPage(currentPage + 1),
  });

  // ── Save flow ────────────────────────────────────────────────────────

  /** Total number of pending mistakes across all pages. */
  const pendingTotal = useMemo(
    () =>
      Object.values(pendingMistakesByPage).reduce(
        (sum, arr) => sum + arr.length,
        0,
      ),
    [pendingMistakesByPage],
  );

  const allPendingFlat = useMemo(() => {
    const all: PendingMistake[] = [];
    for (const list of Object.values(pendingMistakesByPage)) {
      all.push(...list);
    }
    return all;
  }, [pendingMistakesByPage]);

  const handleSave = async () => {
    if (allPendingFlat.length === 0) return;
    if (!sessionId || sessionId === "undefined") {
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ",
        description: "الجلسة غير صالحة.",
      });
      return;
    }

    // Build one assessment page per page that has pending mistakes. Each page's
    // quality is the teacher override if set, otherwise the auto-suggested
    // quality derived from that page's mistake counts (same algorithm as the
    // live header). This records a real recitation per page so points / XP /
    // achievements fire exactly like the recitation tab.
    const pages = Object.entries(pendingMistakesByPage)
      .filter(([, list]) => list.length > 0)
      .map(([pageStr, list]) => {
        const pageNum = Number(pageStr);
        const autoQuality = calculatePageScore(
          tallyMistakes(list),
        ).suggestedQuality;
        const quality =
          qualityOverridesByPage[pageNum] ?? autoQuality;
        return {
          pageNumber: pageNum,
          quality,
          // Each page carries its own lesson type. A page that was marked must
          // have been visited, so its entry is seeded; NEW_LESSON is a safe
          // fallback for the rare race where history hadn't resolved yet.
          type: lessonTypeByPage[pageNum] ?? RecitationType.NEW_LESSON,
          mistakes: list.map((m) => ({
            wordLocation: m.wordLocation,
            surahNumber: m.surahNumber,
            ayahNumber: m.ayahNumber,
            wordPosition: m.wordPosition,
            mistakeType: m.mistakeType,
          })),
        };
      });

    try {
      const result = await assessMushaf.mutateAsync({
        studentId: student.id,
        sessionId,
        pages,
      });

      const count = allPendingFlat.length;
      toast({
        title: "تم تسجيل التسميع ✓",
        description: `${result.pageCount} ${result.pageCount === 1 ? "صفحة" : "صفحات"} · ${count} ${count === 1 ? "خطأ" : "أخطاء"} · +${result.totalPointsAwarded} نقطة`,
      });

      // Reset all pending state on successful save. Clearing the lesson-type
      // map lets each page re-derive its default next time (the just-saved
      // pages now have history, so they'll default to REVIEW).
      setPendingMistakesByPage({});
      setQualityOverridesByPage({});
      setLessonTypeByPage({});
      setReRecitePages(new Set());
      setShowReview(false);
      onSaved?.(count);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ",
        description: getApiErrorMessage(error, tErr),
      });
    }
  };

  const undoLastOnPage = () => {
    setPendingMistakesByPage((prev) => {
      const cur = prev[currentPage] ?? [];
      if (cur.length === 0) return prev;
      return { ...prev, [currentPage]: cur.slice(0, -1) };
    });
  };

  const clearPageMistakes = () => {
    setPendingMistakesByPage((prev) => {
      if (!(currentPage in prev)) return prev;
      const next = { ...prev };
      delete next[currentPage];
      return next;
    });
  };

  // ── Surah picker / page jump ─────────────────────────────────────────

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
    const n = parseInt(val, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 604) {
      goToPage(n);
      setShowNav(false);
      setPageInputVal("");
      setNavSearch("");
    }
  };

  /** True when there is at least one mistake (saved or pending) on the page. */
  const pageHasAnyMistake =
    (liveCounts[MistakeType.MEMORIZATION] ?? 0) > 0 ||
    (liveCounts[MistakeType.TAJWEED] ?? 0) > 0 ||
    (liveCounts[MistakeType.TASHKEEL] ?? 0) > 0;

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden bg-background"
      dir="rtl"
    >
      {/* ── Unified top bar ──────────────────────────────────────────────
          One slim row holds everything that used to be spread over two:
          - surah / page chip (opens the navigator)
          - tiny prev/next (swipe is the primary gesture; these are backup)
          - a single "⋯" menu for the secondary tools (history, re-recite,
            lesson type) so the chrome stays out of the teacher's way. */}
      <div className="flex-none flex items-center gap-2 px-2.5 py-1.5 border-b bg-card shadow-sm">
        <button
          onClick={() => setShowNav(true)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold transition-colors active:scale-95 min-w-0 max-w-[45%]"
          title="الانتقال إلى سورة أو صفحة"
        >
          <BookMarked className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {pageData?.topPageSurah?.name ?? "سورة"}
          </span>
          <span className="text-[11px] font-normal opacity-70 tabular-nums shrink-0">
            · {currentPage}
          </span>
        </button>

        {/* Backup page nav — small, swipe stays primary. */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-9 w-8 rounded-lg flex items-center justify-center text-muted-foreground disabled:opacity-30 hover:bg-muted active:scale-95 transition-all"
            title="الصفحة السابقة"
            aria-label="الصفحة السابقة"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= 604}
            className="h-9 w-8 rounded-lg flex items-center justify-center text-muted-foreground disabled:opacity-30 hover:bg-muted active:scale-95 transition-all"
            title="الصفحة التالية"
            aria-label="الصفحة التالية"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Session average — only when more than one page has been marked,
            so it adds signal without cluttering single-page assessments. */}
        {sessionResult &&
          Object.values(pendingMistakesByPage).filter((l) => l.length > 0)
            .length > 1 && (
            <div className="ms-auto flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary">
              <span className="opacity-70">معدّل الجلسة</span>
              <span className="font-black tabular-nums">
                {sessionResult.score.toFixed(1)}
              </span>
            </div>
          )}

        {/* Secondary tools tucked into one menu. */}
        <div
          className={
            sessionResult &&
            Object.values(pendingMistakesByPage).filter((l) => l.length > 0)
              .length > 1
              ? ""
              : "ms-auto"
          }
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70 active:scale-95 transition-all"
                title="المزيد"
                aria-label="المزيد"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-right">
              <DropdownMenuItem onClick={() => setShowHistory(true)}>
                <History className="h-4 w-4 ms-0 me-2" />
                سجل التسميع
              </DropdownMenuItem>

              {hasSavedAttempt &&
                (isReReciting ? (
                  <DropdownMenuItem onClick={cancelReRecite}>
                    <X className="h-4 w-4 me-2" />
                    إلغاء إعادة التسميع
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={startReRecite}>
                    <RotateCcw className="h-4 w-4 me-2" />
                    إعادة تسميع هذه الصفحة
                  </DropdownMenuItem>
                ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] text-muted-foreground font-medium">
                نوع التسميع
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => chooseLessonType(RecitationType.REVIEW)}
              >
                {currentLessonType === RecitationType.REVIEW && (
                  <Check className="h-4 w-4 me-2" />
                )}
                <span
                  className={
                    currentLessonType === RecitationType.REVIEW ? "" : "ms-6"
                  }
                >
                  مراجعة
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => chooseLessonType(RecitationType.NEW_LESSON)}
              >
                {currentLessonType === RecitationType.NEW_LESSON && (
                  <Check className="h-4 w-4 me-2" />
                )}
                <span
                  className={
                    currentLessonType === RecitationType.NEW_LESSON ? "" : "ms-6"
                  }
                >
                  حفظ جديد
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Live score header — chips + score, only meaningful once marking. */}
      <LiveScoreHeader
        counts={liveCounts}
        result={liveResult}
        overrideQuality={qualityOverridesByPage[currentPage] ?? null}
        className="flex-none"
      />

      {/* Re-recite banner — reminds the teacher this is a fresh attempt. */}
      {isReReciting && (
        <div className="flex-none flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold border-b border-primary/20">
          <RotateCcw className="h-3.5 w-3.5" />
          إعادة تسميع — محاولة جديدة لصفحة {currentPage}. المحاولة السابقة محفوظة في السجل.
        </div>
      )}

      {/* Locked banner — this page already has a saved attempt, so it is
          read-only. Editing requires starting a fresh attempt. */}
      {pageLocked && (
        <div className="flex-none flex items-center justify-between gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-medium border-b border-amber-200 dark:border-amber-900">
          <span className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            هذه الصفحة مسمّعة من قبل — للتعديل ابدأ إعادة تسميع
          </span>
          <button
            onClick={startReRecite}
            className="flex items-center gap-1 rounded-lg bg-primary/10 text-primary px-2 py-1 font-bold hover:bg-primary/20 active:scale-95 transition-all shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            إعادة تسميع
          </button>
        </div>
      )}

      {/* Mushaf body.
          While the radial mistake picker is open we lock scrolling entirely
          (overflow-hidden + touch-none) so a vertical finger drag selects the
          mistake option above the word (e.g. the memorization option, which
          sits straight up) instead of scrolling the page away. Normal reading
          keeps vertical scroll + horizontal swipe-to-flip. */}
      <div
        className={cn(
          "flex-1 min-h-0 overscroll-contain",
          radial.state !== null
            ? "overflow-hidden touch-none"
            : "overflow-y-auto touch-pan-y",
        )}
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchEnd={swipeHandlers.onTouchEnd}
      >
        {isLoading ? (
          <div className="flex h-full min-h-[200px] items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">جاري التحميل...</span>
          </div>
        ) : pageError ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-muted-foreground">
              تعذّر تحميل الصفحة
            </p>
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
            interactive={!pageLocked}
            onWordPointerDown={handleWordPointerDown}
            selectedWords={selectedWords}
            highlightedWords={combinedHighlightMap}
          />
        ) : null}
      </div>

      {/* Quality row.
          - Editable picker: only on an unlocked page with at least one
            mistake. On a locked (already-recited) page the picker is hidden
            so the saved rating cannot be silently changed and re-saved.
          - Read-only chip: on a locked page, show the rating that was actually
            saved for the latest attempt (from its recitation row). */}
      {pageHasAnyMistake && !pageLocked && (
        <QualityOverridePicker
          suggested={liveResult.suggestedQuality}
          override={qualityOverridesByPage[currentPage] ?? null}
          onChange={(next) =>
            setQualityOverridesByPage((prev) => ({
              ...prev,
              [currentPage]: next,
            }))
          }
          className="flex-none mx-3 mb-1"
        />
      )}

      {pageLocked && pageHistory?.[0]?.quality && (
        <div className="flex-none mx-3 mb-1 flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-xs">
          <span className="font-medium text-muted-foreground">
            التقييم المحفوظ
          </span>
          <span
            className={cn(
              "font-bold",
              QUALITY_COLOR_AR[pageHistory[0].quality as string] ??
                "text-foreground",
            )}
          >
            {QUALITY_LABEL_AR[pageHistory[0].quality as string] ??
              pageHistory[0].quality}
          </span>
        </div>
      )}

      {/* Pending review panel */}
      {showReview && pendingTotal > 0 && (
        <div className="flex-none border-t flex flex-col max-h-[40vh] bg-background shadow-lg">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b">
            <span className="text-sm font-bold">
              الأخطاء المعلقة
              <span className="mx-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white tabular-nums">
                {pendingTotal}
              </span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={clearPageMistakes}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
                disabled={pendingForPage.length === 0}
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف صفحة {currentPage}
              </button>
              <button
                onClick={() => setShowReview(false)}
                className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {Object.entries(pendingMistakesByPage)
                .filter(([, list]) => list.length > 0)
                .sort(([a], [b]) => Number(a) - Number(b))
                .flatMap(([page, list]) =>
                  list.map((m) => ({ ...m, _page: Number(page) })),
                )
                .map((m) => {
                  const style = getMistakeStyle(m.mistakeType);
                  const Icon = style.icon;
                  return (
                    <div
                      key={`${m._page}:${m.wordLocation}`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "flex-none inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded",
                            style.bgSoft,
                            style.textSoft,
                          )}
                        >
                          <Icon className="h-3 w-3" strokeWidth={2.5} />
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
                        onClick={() =>
                          setPendingMistakesByPage((prev) => {
                            const arr = prev[m._page] ?? [];
                            const next = arr.filter(
                              (x) => x.wordLocation !== m.wordLocation,
                            );
                            if (next.length === 0) {
                              const copy = { ...prev };
                              delete copy[m._page];
                              return copy;
                            }
                            return { ...prev, [m._page]: next };
                          })
                        }
                        className="flex-none h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="إزالة"
                        aria-label="إزالة"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* ── Bottom action bar ────────────────────────────────────────────
          Lean by design: the undo + review controls only appear once there
          is something pending, so an untouched page shows just a calm,
          full-width primary action. */}
      <div className="flex-none flex items-center gap-2 px-3 py-2.5 border-t bg-card">
        {pendingTotal > 0 && (
          <>
            <button
              onClick={undoLastOnPage}
              disabled={pendingForPage.length === 0}
              className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center disabled:opacity-30 hover:bg-muted/70 transition-colors active:scale-95"
              title="تراجع عن الأخير"
              aria-label="تراجع عن الأخير"
            >
              <Undo2 className="h-4 w-4" />
            </button>

            <button
              onClick={() => setShowReview((v) => !v)}
              className="h-11 px-3 rounded-xl text-sm font-bold flex items-center gap-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60 active:scale-95 transition-all"
            >
              <span className="min-w-[1.5rem] h-5 rounded-full bg-red-500 text-white text-xs font-bold inline-flex items-center justify-center px-1 tabular-nums">
                {pendingTotal}
              </span>
              {showReview ? "إخفاء" : "مراجعة"}
            </button>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={pendingTotal === 0 || assessMushaf.isPending}
          className={cn(
            "flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
            pendingTotal > 0 && !assessMushaf.isPending
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
          )}
        >
          {assessMushaf.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>جاري الحفظ...</span>
            </>
          ) : pendingTotal > 0 ? (
            <>
              <Check className="h-4 w-4" />
              حفظ التسميع
              <span className="opacity-75 font-normal text-xs tabular-nums">
                ({pendingTotal})
              </span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              اضغط مطولاً على كلمة لتحديد خطأ
            </>
          )}
        </button>
      </div>

      {/* Surah / Page navigator overlay */}
      {showNav && (
        <div className="absolute inset-0 z-40 flex flex-col bg-background">
          <div className="flex-none flex items-center justify-between px-4 py-3 border-b bg-card shadow-sm">
            <h2 className="font-bold text-lg">الانتقال إلى</h2>
            <button
              onClick={() => {
                setShowNav(false);
                setNavSearch("");
                setPageInputVal("");
              }}
              className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

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
                  parseInt(pageInputVal, 10) < 1 ||
                  parseInt(pageInputVal, 10) > 604
                }
                className={cn(
                  "h-11 px-4 rounded-lg font-bold text-sm transition-all",
                  pageInputVal &&
                    parseInt(pageInputVal, 10) >= 1 &&
                    parseInt(pageInputVal, 10) <= 604
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                    : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed",
                )}
                aria-label="انتقال"
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
          </div>

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
      )}

      {/* Floating radial picker — rendered in a portal so it escapes the
          assessor's overflow:hidden boundary. */}
      {radial.state && (
        <RadialMistakePicker
          anchor={radial.state.anchor}
          items={radial.state.items}
          activeIndex={radial.state.activeIndex}
        />
      )}

      {/* Recitation history panel for the current page */}
      <PageHistorySheet
        open={showHistory}
        onOpenChange={setShowHistory}
        studentId={student.id}
        pageNumber={currentPage}
      />
    </div>
  );
};
