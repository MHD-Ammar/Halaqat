"use client";

/**
 * StudentActionSheet Component
 *
 * A 2-step wizard for recording page recitations:
 * Step 1: Range Input - Enter page range and global quality
 * Step 2: Review List - Adjust individual page qualities before saving
 */

import { useState, useMemo } from "react";
import {
  Loader2,
  Check,
  ChevronRight,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { RecitationType, RecitationQuality } from "@halaqat/types";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  useRecordRecitation,
  type PageDetail,
} from "@/hooks/use-record-recitation";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudentActionSheetProps {
  student: {
    id: string;
    name: string;
  };
  sessionId: string;
  circleId: string;
  children: React.ReactNode;
}

/**
 * Quality configuration with colors
 */
const QUALITY_OPTIONS = [
  {
    value: RecitationQuality.EXCELLENT,
    label: "Excellent",
    shortLabel: "Exc",
    color: "bg-emerald-500 hover:bg-emerald-600 text-white",
    selectedColor: "ring-2 ring-emerald-500 ring-offset-2",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    value: RecitationQuality.VERY_GOOD,
    label: "Very Good",
    shortLabel: "V.Good",
    color: "bg-green-500 hover:bg-green-600 text-white",
    selectedColor: "ring-2 ring-green-500 ring-offset-2",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    value: RecitationQuality.GOOD,
    label: "Good",
    shortLabel: "Good",
    color: "bg-blue-500 hover:bg-blue-600 text-white",
    selectedColor: "ring-2 ring-blue-500 ring-offset-2",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    value: RecitationQuality.ACCEPTABLE,
    label: "Acceptable",
    shortLabel: "Acc",
    color: "bg-yellow-500 hover:bg-yellow-600 text-white",
    selectedColor: "ring-2 ring-yellow-500 ring-offset-2",
    badgeColor: "bg-yellow-100 text-yellow-700",
  },
  {
    value: RecitationQuality.POOR,
    label: "Poor",
    shortLabel: "Poor",
    color: "bg-red-500 hover:bg-red-600 text-white",
    selectedColor: "ring-2 ring-red-500 ring-offset-2",
    badgeColor: "bg-red-100 text-red-700",
  },
];

type WizardStep = "INPUT" | "REVIEW";

export function StudentActionSheet({
  student,
  sessionId,
  children,
}: StudentActionSheetProps) {
  const { toast } = useToast();
  const recordRecitation = useRecordRecitation();

  // Wizard state
  const [step, setStep] = useState<WizardStep>("INPUT");
  const [isOpen, setIsOpen] = useState(false);

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

  // Reset form
  const resetForm = () => {
    setStep("INPUT");
    setStartPage("");
    setEndPage("");
    setGlobalQuality(RecitationQuality.EXCELLENT);
    setLessonType(RecitationType.NEW_LESSON);
    setPageDetails([]);
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

    try {
      const result = await recordRecitation.mutateAsync({
        studentId: student.id,
        sessionId,
        details: pageDetails,
      });

      toast({
        title: "Recitation Recorded!",
        description: `${result.pageCount} pages saved. +${result.totalPointsAwarded} points awarded.`,
      });

      handleOpenChange(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to save recitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Record Recitation - {student.name}
          </SheetTitle>
          <SheetDescription>
            {step === "INPUT"
              ? "Enter page range and select quality"
              : `Review ${pageDetails.length} pages before saving`}
          </SheetDescription>
        </SheetHeader>

        {/* Step 1: Range Input */}
        {step === "INPUT" && (
          <div className="flex-1 space-y-6 py-4 overflow-auto">
            {/* Page Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startPage">Start Page</Label>
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
                <Label htmlFor="endPage">End Page</Label>
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
                {(endPage as number) - (startPage as number) + 1} page(s)
                selected
              </div>
            )}

            {/* Quality Selection */}
            <div className="space-y-2">
              <Label>Quality</Label>
              <div className="grid grid-cols-5 gap-2">
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
                    {option.shortLabel}
                  </Button>
                ))}
              </div>
            </div>

            {/* Lesson Type Toggle */}
            <div className="space-y-2">
              <Label>Lesson Type</Label>
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
                  New Lesson
                </Button>
                <Button
                  type="button"
                  variant={
                    lessonType === RecitationType.REVIEW ? "default" : "outline"
                  }
                  className="flex-1 h-12"
                  onClick={() => setLessonType(RecitationType.REVIEW)}
                >
                  Review
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review List */}
        {step === "REVIEW" && (
          <ScrollArea className="flex-1 py-4">
            <div className="space-y-3 pr-4">
              {pageDetails.map((page) => {
                return (
                  <div
                    key={page.pageNumber}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="font-medium">Page {page.pageNumber}</div>
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

        {/* Footer with Actions */}
        <SheetFooter className="flex-row gap-2 pt-4 border-t">
          {step === "INPUT" ? (
            <Button
              className="flex-1 h-12"
              disabled={!isStep1Valid}
              onClick={handleNext}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button variant="outline" className="h-12" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                className="flex-1 h-12"
                disabled={recordRecitation.isPending}
                onClick={handleSaveAll}
              >
                {recordRecitation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save All ({pageDetails.length} pages)
                  </>
                )}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
