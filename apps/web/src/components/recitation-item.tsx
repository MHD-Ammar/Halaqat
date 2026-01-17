"use client";

/**
 * RecitationItem Component
 *
 * Ticket-style display of a recitation record.
 */

import { Badge } from "@/components/ui/badge";
import { RecitationQuality } from "@halaqat/types";

interface RecitationItemProps {
  surahName: string;
  surahNameArabic?: string;
  startVerse: number;
  endVerse: number;
  quality: string;
  type: string;
  createdAt: string;
}

const qualityConfig: Record<
  string,
  { label: string; className: string }
> = {
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
  surahName,
  surahNameArabic,
  startVerse,
  endVerse,
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
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{surahName}</span>
          {surahNameArabic && (
            <span className="text-muted-foreground text-sm">
              ({surahNameArabic})
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Verses {startVerse}-{endVerse} • {type === "NEW" ? "New Lesson" : "Review"} • {date}
        </div>
      </div>
      <Badge variant="outline" className={qualityInfo.className}>
        {qualityInfo.label}
      </Badge>
    </div>
  );
}
