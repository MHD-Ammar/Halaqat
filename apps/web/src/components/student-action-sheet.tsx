"use client";

/**
 * StudentActionSheet Component
 *
 * A tabbed interface for interacting with students:
 * - Recitation Tab: 2-step wizard for recording page recitations
 * - Rewards Tab: Quick reward awarding using custom reward categories
 *
 * Shows Surah names next to page numbers in the review list.
 */

import { RecitationType, RecitationQuality } from "@halaqat/types";
import {
  Loader2,
  Check,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Gift,
  AlertTriangle,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastAction } from "@/components/ui/toast";
import {
  useRecordRecitation,
  type PageDetail,
} from "@/hooks/use-record-recitation";
import {
  useSurahsWithPages,
  findSurahForPage,
} from "@/hooks/use-surahs-with-pages";
import {
  useTeacherRewards,
  useAwardReward,
  useTeacherBudget,
  useAddManualPoints,
  type AwardByRuleDto,
} from "@/hooks/use-teacher-rewards";
import { useToast } from "@/hooks/use-toast";

interface StudentActionSheetProps {
  student: {
    id: string;
    name: string;
  };
  sessionId: string;
  circleId: string;
  children: React.ReactNode;
}

type WizardStep = "INPUT" | "REVIEW";

export function StudentActionSheet({
  student,
  sessionId,
  children,
}: StudentActionSheetProps) {
  const { toast } = useToast();
  const recordRecitation = useRecordRecitation();
  const { data: surahs } = useSurahsWithPages();
  const { data: rewardRules = [], isLoading: isLoadingRules } = useTeacherRewards();
  const { data: budget } = useTeacherBudget(sessionId);
  const awardReward = useAwardReward();
  const addManualPoints = useAddManualPoints();
  const t = useTranslations("StudentAction");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  /**
   * Quality configuration with colors
   */
  const QUALITY_OPTIONS = useMemo(
    () => [
      {
        value: RecitationQuality.EXCELLENT,
        label: t("excellent"),
        shortLabel: t("excellentShort"),
        color: "bg-emerald-500 hover:bg-emerald-600 text-white",
        selectedColor: "ring-2 ring-emerald-500 ring-offset-2",
        badgeColor: "bg-emerald-100 text-emerald-700",
      },
      {
        value: RecitationQuality.VERY_GOOD,
        label: t("veryGood"),
        shortLabel: t("veryGoodShort"),
        color: "bg-green-500 hover:bg-green-600 text-white",
        selectedColor: "ring-2 ring-green-500 ring-offset-2",
        badgeColor: "bg-green-100 text-green-700",
      },
      {
        value: RecitationQuality.GOOD,
        label: t("good"),
        shortLabel: t("goodShort"),
        color: "bg-blue-500 hover:bg-blue-600 text-white",
        selectedColor: "ring-2 ring-blue-500 ring-offset-2",
        badgeColor: "bg-blue-100 text-blue-700",
      },
      // {
      //   value: RecitationQuality.ACCEPTABLE,
      //   label: t("acceptable"),
      //   shortLabel: t("acceptableShort"),
      //   color: "bg-yellow-500 hover:bg-yellow-600 text-white",
      //   selectedColor: "ring-2 ring-yellow-500 ring-offset-2",
      //   badgeColor: "bg-yellow-100 text-yellow-700",
      // },
      {
        value: RecitationQuality.POOR,
        label: t("notAccepted"),
        shortLabel: t("notAcceptedShort"),
        color: "bg-red-500 hover:bg-red-600 text-white",
        selectedColor: "ring-2 ring-red-500 ring-offset-2",
        badgeColor: "bg-red-100 text-red-700",
      },
    ],
    [t],
  );

  // Wizard state
  const [step, setStep] = useState<WizardStep>("INPUT");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"recitation" | "rewards">("recitation");

  // Step 1: Range input state
  const [startPage, setStartPage] = useState<number | "">("");
  const [endPage, setEndPage] = useState<number | "">("");
  const [globalQuality, setGlobalQuality] = useState<RecitationQuality>(
    RecitationQuality.EXCELLENT,
  );
  const [lessonType, setLessonType] = useState<RecitationType>(
    RecitationType.NEW_LESSON,
  );

  // Step 2: Page details state (with individual quality overrides)
  const [pageDetails, setPageDetails] = useState<PageDetail[]>([]);

  // Rewards tab state
  const [selectedRule, setSelectedRule] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [awardingRuleId, setAwardingRuleId] = useState<number | null>(null);

  // Reset form
  const resetForm = () => {
    setStep("INPUT");
    setStartPage("");
    setEndPage("");
    setGlobalQuality(RecitationQuality.EXCELLENT);
    setLessonType(RecitationType.NEW_LESSON);
    setPageDetails([]);
    setSelectedRule(null);
    setCustomAmount(0);
    setAwardingRuleId(null);
  };

  // Handle open change
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  // Validate step 1
  const isStep1Valid = useMemo(() => {
    if (startPage === "" || endPage === "") return false;
    if (startPage < 1 || startPage > 604) return false;
    if (endPage < 1 || endPage > 604) return false;
    if (endPage < startPage) return false;
    return true;
  }, [startPage, endPage]);

  // Handle Next button (go to review step)
  const handleNext = () => {
    if (!isStep1Valid) return;

    // Generate page details array from range
    const pages: PageDetail[] = [];
    for (let page = startPage as number; page <= (endPage as number); page++) {
      pages.push({
        pageNumber: page,
        quality: globalQuality,
        type: lessonType,
      });
    }

    setPageDetails(pages);
    setStep("REVIEW");
  };

  // Handle Back button (go back to input step)
  const handleBack = () => {
    setStep("INPUT");
  };

  // Update individual page quality
  const updatePageQuality = (
    pageNumber: number,
    quality: RecitationQuality,
  ) => {
    setPageDetails((prev) =>
      prev.map((p) => (p.pageNumber === pageNumber ? { ...p, quality } : p)),
    );
  };

  // Handle Save All
  const handleSaveAll = async () => {
    if (pageDetails.length === 0) return;
    if (!student.id || student.id === "undefined") {
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: "Invalid Student ID",
      });
      return;
    }
    if (!sessionId || sessionId === "undefined") {
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: "Invalid Session ID",
      });
      return;
    }

    try {
      const result = await recordRecitation.mutateAsync({
        studentId: student.id,
        sessionId,
        details: pageDetails,
      });

      toast({
        title: t("recitationRecorded"),
        description: t("recitationSavedDescription", {
          pageCount: result.pageCount,
          points: result.totalPointsAwarded,
        }),
      });

      handleOpenChange(false);
    } catch {
      toast({
        title: tCommon("error"),
        description: t("saveFailed"),
        variant: "destructive",
      });
    }
  };

  // Handle awarding a reward
  const handleAwardReward = async (
    ruleId: number,
    isCustomEntry: boolean,
    maxCustomValue: number | null,
    customAmountOverride?: number 
  ) => {
    if (!sessionId || sessionId === "undefined") {
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: "Invalid Session ID",
      });
      return;
    }

    // For custom entry rules, show input first
    if (isCustomEntry && selectedRule !== ruleId) {
      setSelectedRule(ruleId);
      setCustomAmount(0);
      return;
    }

    // Validate custom amount
    if (isCustomEntry) {
      if (customAmount <= 0) {
        toast({
          variant: "destructive",
          title: tCommon("error"),
          description: t("rewardsTab.enterAmount"),
        });
        return;
      }
      if (maxCustomValue && customAmount > maxCustomValue) {
        toast({
          variant: "destructive",
          title: tCommon("error"),
          description: t("rewardsTab.exceedsMax", { max: maxCustomValue }),
        });
        return;
      }
    }

    setAwardingRuleId(ruleId);

    const finalAmount = customAmountOverride ?? (isCustomEntry ? customAmount : 0);
    
    const payload: AwardByRuleDto = {
      studentId: student.id,
      sessionId,
      ruleId,
    };

    if (finalAmount > 0) {
      payload.customAmount = finalAmount;
    }

    awardReward.mutate(payload, {
      onSuccess: () => {
        const rule = rewardRules.find((r) => r.id === ruleId);
        const pointsAwarded = isCustomEntry ? customAmount : rule?.points || 0;

        toast({
          title: t("rewardsTab.awarded"),
          description: t("rewardsTab.awardedDesc", {
            name: rule?.description || "",
            points: pointsAwarded,
          }),
          action: (
            <ToastAction
              altText={tCommon("undo")}
              onClick={() => {
                const undoReason = `Undo: ${rule?.description}`;
                addManualPoints.mutate(
                  {
                    studentId: student.id,
                    sessionId,
                    amount: -pointsAwarded,
                    reason: undoReason,
                  },
                  {
                    onSuccess: () => {
                      toast({ description: t("rewardsTab.undoSuccess") });
                    },
                  }
                );
              }}
            >
              {tCommon("undo")}
            </ToastAction>
          ),
        });
        setAwardingRuleId(null);
        if (isCustomEntry) {
          setCustomAmount(0);
          setSelectedRule(null);
        }
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || error.message;
        let displayMessage = errorMessage || t("saveFailed");

        // improved error mapping for budget limit
        if (errorMessage && errorMessage.includes("limit")) {
             displayMessage = t("rewardsTab.budgetExceededError");
        }

        toast({
          variant: "destructive",
          title: tCommon("error"),
          description: displayMessage,
        });
        setAwardingRuleId(null);
      },
    });
  };

  /**
   * Get surah name for a page number
   */
  const getSurahName = (pageNumber: number): string => {
    const surah = findSurahForPage(surahs, pageNumber);
    return surah?.nameEnglish || "";
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="flex flex-col" dir={dir}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {student.name}
          </SheetTitle>
          <SheetDescription>
            {activeTab === "recitation"
              ? step === "INPUT"
                ? t("enterPageRange")
                : t("reviewPages", { count: pageDetails.length })
              : t("rewardsTab.description")}
          </SheetDescription>
        </SheetHeader>

        {/* Tabbed Interface */}
        <Tabs
          dir={dir}
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "recitation" | "rewards")}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recitation" className="gap-2">
              <BookOpen className="h-4 w-4" />
              {t("recitationTab")}
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2">
              <Gift className="h-4 w-4" />
              {t("rewardsTab.title")}
            </TabsTrigger>
          </TabsList>

          {/* Recitation Tab Content */}
          <TabsContent value="recitation" className="flex-1 flex flex-col overflow-hidden mt-0">
            {/* Step 1: Range Input */}
            {step === "INPUT" && (
              <div className="flex-1 space-y-6 p-4 overflow-auto">
                {/* Page Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startPage">{t("startPage")}</Label>
                    <Input
                      id="startPage"
                      type="number"
                      min={1}
                      max={604}
                      placeholder="1"
                      value={startPage}
                      onChange={(e) =>
                        setStartPage(
                          e.target.value === "" ? "" : parseInt(e.target.value, 10),
                        )
                      }
                      className="h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endPage">{t("endPage")}</Label>
                    <Input
                      id="endPage"
                      type="number"
                      min={1}
                      max={604}
                      placeholder="604"
                      value={endPage}
                      onChange={(e) =>
                        setEndPage(
                          e.target.value === "" ? "" : parseInt(e.target.value, 10),
                        )
                      }
                      className="h-12 text-lg"
                    />
                  </div>
                </div>

                {/* Page count indicator */}
                {isStep1Valid && (
                  <div className="text-center text-sm text-muted-foreground">
                    {t("pagesSelected", {
                      count: (endPage as number) - (startPage as number) + 1,
                    })}
                  </div>
                )}

                {/* Quality Selection */}
                <div className="space-y-2">
                  <Label>{t("quality")}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {QUALITY_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`h-12 text-sm font-medium ${option.color} ${
                          globalQuality === option.value ? option.selectedColor : ""
                        }`}
                        onClick={() => setGlobalQuality(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Lesson Type Toggle */}
                <div className="space-y-2">
                  <Label>{t("lessonType")}</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={
                        lessonType === RecitationType.NEW_LESSON
                          ? "default"
                          : "outline"
                      }
                      className="flex-1 h-12"
                      onClick={() => setLessonType(RecitationType.NEW_LESSON)}
                    >
                      {t("newLesson")}
                    </Button>
                    <Button
                      type="button"
                      variant={
                        lessonType === RecitationType.REVIEW ? "default" : "outline"
                      }
                      className="flex-1 h-12"
                      onClick={() => setLessonType(RecitationType.REVIEW)}
                    >
                      {t("review")}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Review List with Surah Names */}
            {step === "REVIEW" && (
              <ScrollArea className="flex-1 py-4">
                <div className="space-y-3 pe-4">
                  {pageDetails.map((page) => {
                    const surahName = getSurahName(page.pageNumber);

                    return (
                      <div
                        key={page.pageNumber}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div>
                          <div className="font-medium">
                            {tCommon("page")} {page.pageNumber}
                          </div>
                          {surahName && (
                            <div className="text-sm text-muted-foreground">
                              {surahName}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {QUALITY_OPTIONS.map((option) => (
                            <Button
                              key={option.value}
                              type="button"
                              variant="ghost"
                              size="sm"
                              className={`h-8 px-2 text-xs ${
                                page.quality === option.value
                                  ? option.badgeColor + " font-semibold"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                              onClick={() =>
                                updatePageQuality(page.pageNumber, option.value)
                              }
                            >
                              {option.shortLabel}
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {/* Footer with Actions for Recitation Tab */}
            <SheetFooter className="flex-row gap-2 pt-4 border-t">
              {step === "INPUT" ? (
                <Button
                  className="flex-1 h-12"
                  disabled={!isStep1Valid}
                  onClick={handleNext}
                >
                  {tCommon("next")}
                  <ChevronRight className="ms-2 h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="h-12" onClick={handleBack}>
                    <ArrowLeft className="me-2 h-4 w-4" />
                    {tCommon("back")}
                  </Button>
                  <Button
                    className="flex-1 h-12"
                    disabled={recordRecitation.isPending}
                    onClick={handleSaveAll}
                  >
                    {recordRecitation.isPending ? (
                      <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        {tCommon("saving")}
                      </>
                    ) : (
                      <>
                        <Check className="me-2 h-4 w-4" />
                        {t("saveAll", { count: pageDetails.length })}
                      </>
                    )}
                  </Button>
                </>
              )}
            </SheetFooter>
          </TabsContent>

          {/* Rewards Tab Content */}
          <TabsContent value="rewards" className="flex-1 flex flex-col overflow-hidden mt-0">
            {/* Budget Indicator */}
            {budget && (
              <div className="px-4 py-2 bg-muted/30 border-b flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("rewardsTab.budget")}:</span>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${budget.remaining === 0 ? "text-red-600" : ""}`}>
                    {budget.used}/{budget.limit}
                  </span>
                  {budget.remaining === 0 && (
                    <span className="text-xs text-red-500 font-medium px-1.5 py-0.5 bg-red-100 rounded">
                      {t("rewardsTab.budgetExceeded")}
                    </span>
                  )}
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 py-4">
              {isLoadingRules ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : rewardRules.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>{t("rewardsTab.noRewards")}</p>
                  <p className="text-sm">{t("rewardsTab.noRewardsHint")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 p-4 pt-1">
                  {rewardRules.map((rule) => {
                    const isNegative = rule.points < 0;
                    const isBudgetBlocked = !isNegative && budget && budget.remaining === 0;
                    
                    return (
                      <div key={rule.id} className="space-y-2">
                        <Button
                          variant={selectedRule === rule.id ? "default" : "outline"}
                          className={`w-full h-auto flex-col py-4 px-3 ${
                            awardingRuleId === rule.id ? "opacity-50" : ""
                          } ${
                            isNegative 
                              ? "border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                              : ""
                          }`}
                          disabled={awardingRuleId !== null || (isBudgetBlocked && !isNegative)}
                          onClick={() =>
                            handleAwardReward(rule.id, rule.isCustomEntry, rule.maxCustomValue)
                          }
                        >
                          {awardingRuleId === rule.id ? (
                            <Loader2 className="h-5 w-5 animate-spin mb-1" />
                          ) : isNegative ? (
                            <AlertTriangle className="h-5 w-5 mb-1 text-red-500" />
                          ) : (
                            <Gift className="h-5 w-5 mb-1" />
                          )}
                          <span className="text-sm font-medium line-clamp-2">
                            {rule.description}
                          </span>
                          <span className={`text-xs mt-1 ${isNegative ? "text-red-500 font-bold" : "opacity-70"}`}>
                            {rule.isCustomEntry
                              ? t("rewardsTab.upTo", { max: rule.maxCustomValue ?? 0 })
                              : `${rule.points > 0 ? "+" : ""}${rule.points} ${tCommon("points")}`}
                          </span>
                        </Button>

                        {/* Custom amount input */}
                        {rule.isCustomEntry && selectedRule === rule.id && (
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min={1}
                              max={Math.min(rule.maxCustomValue ?? 100, budget?.remaining ?? 100)}
                              value={customAmount}
                              onChange={(e) =>
                                setCustomAmount(parseInt(e.target.value, 10) || 0)
                              }
                              placeholder={t("rewardsTab.amount")}
                              className="h-10"
                            />
                            <Button
                              size="sm"
                              className="h-10 px-4 min-w-[3rem]"
                              disabled={
                                awardReward.isPending || 
                                customAmount <= 0 || 
                                (budget && customAmount > budget.remaining)
                              }
                              onClick={() =>
                                handleAwardReward(
                                  rule.id,
                                  true, // isCustomEntry
                                  rule.maxCustomValue,
                                  customAmount
                                )
                              }
                            >
                              {awardReward.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
