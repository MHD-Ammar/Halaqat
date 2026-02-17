"use client";

/**
 * PointsItem Component
 *
 * Displays a point transaction with color-coded amount.
 */

interface PointsItemProps {
  amount: number;
  reason: string;
  createdAt: string;
}

import { useTranslations } from "next-intl";

interface PointsItemProps {
  amount: number;
  reason: string;
  createdAt: string;
}

// Mapping from backend English descriptions to translation keys
const DESCRIPTION_TO_KEY: Record<string, string> = {
  "Memorizing a new page": "RECITATION_PAGE",
  "Excellent recitation quality": "RECITATION_EXCELLENT",
  "Very good recitation quality": "RECITATION_VERY_GOOD",
  "Good recitation quality": "RECITATION_GOOD",
  "Acceptable recitation quality": "RECITATION_ACCEPTABLE",
  "Poor recitation quality": "RECITATION_POOR",
  "Attending a session": "ATTENDANCE_PRESENT",
  "Arriving on time": "ATTENDANCE_ON_TIME",
  "Excellent exam score": "EXAM_EXCELLENT",
  "Good exam score": "EXAM_GOOD",
  "Points per page of recitation": "RECITATION_PAGE", // Legacy/Seeder
  "Points for excellent recitation with no mistakes": "RECITATION_EXCELLENT",
  "Points for very good recitation with few mistakes": "RECITATION_VERY_GOOD",
  "Points for good recitation": "RECITATION_GOOD",
  "Points for acceptable recitation": "RECITATION_ACCEPTABLE",
  "Points for poor recitation (encouragement only)": "RECITATION_POOR",
  "Points for excellent exam performance (Full Mark)": "EXAM_EXCELLENT",
  "Points for good exam performance": "EXAM_GOOD",
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
