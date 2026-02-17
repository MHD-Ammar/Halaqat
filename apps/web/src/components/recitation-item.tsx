"use client";

/**
 * RecitationItem Component
 *
 * Ticket-style display of a page recitation record.
 * Shows page number with corresponding Surah name.
 */

import { RecitationQuality } from "@halaqat/types";
import { BookOpen } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

import { Badge } from "@/components/ui/badge";

interface RecitationItemProps {
  pageNumber: number;
  surahName?: string;
  surahNameArabic?: string;
  quality: string;
  type: string;
  createdAt: string;
}

const qualityStyles: Record<string, string> = {
  [RecitationQuality.EXCELLENT]: "bg-emerald-100 text-emerald-700 border-emerald-200",
  [RecitationQuality.VERY_GOOD]: "bg-green-100 text-green-700 border-green-200",
  [RecitationQuality.GOOD]: "bg-blue-100 text-blue-700 border-blue-200",
  [RecitationQuality.ACCEPTABLE]: "bg-yellow-100 text-yellow-700 border-yellow-200",
  [RecitationQuality.POOR]: "bg-red-100 text-red-700 border-red-200",
};

export function RecitationItem({
  pageNumber,
  surahName,
  surahNameArabic,
  quality,
  type,
  createdAt,
}: RecitationItemProps) {
  const tStudentAction = useTranslations("StudentAction");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  
  const qualityLabelMap: Record<string, string> = {
    [RecitationQuality.EXCELLENT]: tStudentAction("excellent"),
    [RecitationQuality.VERY_GOOD]: tStudentAction("veryGood"),
    [RecitationQuality.GOOD]: tStudentAction("good"),
    [RecitationQuality.ACCEPTABLE]: tStudentAction("acceptable"),
    [RecitationQuality.POOR]: tStudentAction("poor"),
  };

  const label = qualityLabelMap[quality] || quality;
  const className = qualityStyles[quality] || "bg-gray-100 text-gray-700";

  const date = new Date(createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
  });

  const typeLabel =
    type === "NEW" || type === "NEW_LESSON"
      ? tStudentAction("newLesson")
      : tStudentAction("review");

  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
      <div className="flex items-start gap-3">
        {/* Page Number Badge */}
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-semibold text-lg">
          {pageNumber}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {surahName && (
              <>
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{surahName}</span>
                {surahNameArabic && (
                  <span className="text-muted-foreground text-sm" dir="rtl">
                    {surahNameArabic}
                  </span>
                )}
              </>
            )}
            {!surahName && (
              <span className="font-medium">{tCommon("page")} {pageNumber}</span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {typeLabel} • {date}
          </div>
        </div>
      </div>

      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    </div>
  );
}
