"use client";

/**
 * DateRangePicker Component
 *
 * Reusable date range picker with preset options.
 * Uses Calendar + Popover for selection.
 */

import { format, subDays, startOfMonth } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DateRangePreset = "today" | "7days" | "30days" | "thisMonth" | "custom";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

/**
 * Get preset date ranges
 */
function getPresetRange(preset: DateRangePreset): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7days":
      return { from: subDays(today, 6), to: today };
    case "30days":
      return { from: subDays(today, 29), to: today };
    case "thisMonth":
      return { from: startOfMonth(today), to: today };
    default:
      return { from: subDays(today, 6), to: today };
  }
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const t = useTranslations("TeacherDashboard");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? ar : enUS;

  const presets: { key: DateRangePreset; label: string }[] = [
    { key: "today", label: t("today") },
    { key: "7days", label: t("last7Days") },
    { key: "30days", label: t("last30Days") },
    { key: "thisMonth", label: t("thisMonth") },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-start font-normal gap-2",
            !dateRange && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          {dateRange?.from ? (
            dateRange.to ? (
              <span className="truncate">
                {format(dateRange.from, "dd MMM", { locale: dateLocale })}
                {" - "}
                {format(dateRange.to, "dd MMM yyyy", { locale: dateLocale })}
              </span>
            ) : (
              format(dateRange.from, "dd MMM yyyy", { locale: dateLocale })
            )
          ) : (
            <span>{t("selectDateRange")}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {/* Presets */}
        <div className="flex flex-wrap gap-1 p-3 pb-0">
          {presets.map((preset) => (
            <Button
              key={preset.key}
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => onDateRangeChange(getPresetRange(preset.key))}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Calendar */}
        <Calendar
          mode="range"
          {...(dateRange?.from ? { defaultMonth: dateRange.from } : {})}
          {...(dateRange ? { selected: dateRange } : {})}
          onSelect={onDateRangeChange}
          numberOfMonths={1}
          locale={dateLocale}
          disabled={{ after: new Date() }}
        />
      </PopoverContent>
    </Popover>
  );
}
