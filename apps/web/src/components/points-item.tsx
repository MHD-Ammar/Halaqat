"use client";

/**
 * PointsItem Component
 *
 * Displays a point transaction with color-coded amount.
 */

import { useTranslations } from "next-intl";

interface PointsItemProps {
  amount: number;
  reason: string;
  createdAt: string;
}

// Mapping from backend English/Arabic descriptions to translation keys
const DESCRIPTION_TO_KEY: Record<string, string> = {
  "Memorizing a new page": "RECITATION_PAGE",
  "Excellent recitation quality": "RECITATION_EXCELLENT",
  "Very good recitation quality": "RECITATION_VERY_GOOD",
  "Good recitation quality": "RECITATION_GOOD",
  "Acceptable recitation quality": "RECITATION_ACCEPTABLE",
  "Poor recitation quality": "RECITATION_POOR",
  "Attending a session": "ATTENDANCE_ON_TIME",
  "Arriving on time": "ATTENDANCE_ON_TIME",
  "Absent": "ATTENDANCE_ABSENT",
  "Excused absence": "ATTENDANCE_EXCUSED",
  "Excellent exam score": "EXAM_EXCELLENT",
  "Good exam score": "EXAM_GOOD",
  // Seed-data descriptions
  "Points per page of recitation": "RECITATION_PAGE",
  "Points for excellent recitation with no mistakes": "RECITATION_EXCELLENT",
  "Points for very good recitation with few mistakes": "RECITATION_VERY_GOOD",
  "Points for good recitation": "RECITATION_GOOD",
  "Points for acceptable recitation": "RECITATION_ACCEPTABLE",
  "Points for poor recitation (encouragement only)": "RECITATION_POOR",
  "Points for excellent exam performance (Full Mark)": "EXAM_EXCELLENT",
  "Points for good exam performance": "EXAM_GOOD",
  // Arabic seed descriptions
  "حضور في الوقت": "ATTENDANCE_ON_TIME",
  "حضور متأخر": "ATTENDANCE_LATE",
  "غياب": "ATTENDANCE_ABSENT",
  "غياب بعذر": "ATTENDANCE_EXCUSED",
  "شغب / سوء سلوك": "BEHAVIOR_BAD",
};

export function PointsItem({ amount, reason, createdAt }: PointsItemProps) {
  const t = useTranslations("Settings.PointRulesDesc");
  const isPositive = amount > 0;
  const date = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Try to translate the reason if it matches a known system rule
  const translatedReason = DESCRIPTION_TO_KEY[reason]
    ? t(DESCRIPTION_TO_KEY[reason])
    : reason;

  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
      <div className="flex-1">
        <div className="font-medium">{translatedReason}</div>
        <div className="text-sm text-muted-foreground">{date}</div>
      </div>
      <span
        className={`font-bold text-lg ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? "+" : ""}
        {amount}
      </span>
    </div>
  );
}
