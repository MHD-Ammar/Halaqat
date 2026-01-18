"use client";

/**
 * RecitationItem Component
 *
 * Ticket-style display of a page recitation record.
 * Shows page number with corresponding Surah name.
 */

import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { RecitationQuality } from "@halaqat/types";

interface RecitationItemProps {
  pageNumber: number;
  surahName?: string;
  surahNameArabic?: string;
  quality: string;
  type: string;
  createdAt: string;
}

const qualityConfig: Record<string, { label: string; className: string }> = {
  [RecitationQuality.EXCELLENT]: {
    label: "Excellent",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  [RecitationQuality.VERY_GOOD]: {
    label: "Very Good",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  [RecitationQuality.GOOD]: {
    label: "Good",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  [RecitationQuality.ACCEPTABLE]: {
    label: "Acceptable",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  [RecitationQuality.POOR]: {
    label: "Needs Work",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

export function RecitationItem({
  pageNumber,
  surahName,
  surahNameArabic,
  quality,
  type,
  createdAt,
}: RecitationItemProps) {
  const qualityInfo = qualityConfig[quality] || {
    label: quality,
    className: "bg-gray-100 text-gray-700",
  };
  const date = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

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
              <span className="font-medium">Page {pageNumber}</span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {type === "NEW" || type === "NEW_LESSON" ? "New Lesson" : "Review"}{" "}
            • {date}
          </div>
        </div>
      </div>

      <Badge variant="outline" className={qualityInfo.className}>
        {qualityInfo.label}
      </Badge>
    </div>
  );
}
