"use client";

import { Check, Flame } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, useCallback, useMemo } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface StreakCalendarProps {
  streakCalendar: Record<string, boolean>;
}

const HEATMAP_COLORS = {
  empty: "bg-gray-100 dark:bg-gray-800",
  active: "bg-green-300 dark:bg-green-700",
  today: "bg-orange-400 dark:bg-orange-600 ring-2 ring-orange-500/50",
  todayMissing: "bg-red-200 dark:bg-red-900 ring-2 ring-red-400/50 animate-pulse",
};

type DayCell = {
  dateIso: string;
  submitted: boolean;
  date: Date;
};

export function StreakCalendar({ streakCalendar }: StreakCalendarProps) {
  const t = useTranslations("StudentPortal");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar-SA" : "en-US";

  const formatWeekdayShort = useCallback((weekdayIndex: number) => {
    // 2025-01-05 is Sunday. This aligns weekdayIndex 0 with Sunday, 6 with Saturday.
    const date = new Date(Date.UTC(2025, 0, 5 + weekdayIndex));
    return date.toLocaleDateString(dateLocale, { weekday: "short" });
  }, [dateLocale]);

  const sortedDates = useMemo(() => Object.keys(streakCalendar).sort(), [streakCalendar]);
  const days = useMemo<DayCell[]>(
    () =>
      sortedDates.map((dateIso) => ({
        dateIso,
        submitted: streakCalendar[dateIso] ?? false,
        date: new Date(`${dateIso}T00:00:00.000Z`),
      })),
    [sortedDates, streakCalendar],
  );

  const full30Days = useMemo(() => days.slice(-30), [days]);
  const last7Days = useMemo(() => full30Days.slice(-7), [full30Days]);
  const mobile28Days = useMemo(() => full30Days.slice(-28), [full30Days]);
  const newestDay = full30Days[full30Days.length - 1];

  const activeDaysCount = useMemo(
    () => full30Days.reduce((count, d) => (d.submitted ? count + 1 : count), 0),
    [full30Days],
  );

  const longestStreak = useMemo(() => {
    let longest = 0;
    let current = 0;
    for (const day of full30Days) {
      if (day.submitted) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }
    return longest;
  }, [full30Days]);

  const columnCount = Math.ceil(full30Days.length / 7);
  const desktopMatrix = useMemo(() => {
    const matrix: Array<Array<DayCell | null>> = Array.from({ length: 7 }, () =>
      Array.from({ length: columnCount }, () => null),
    );

    const newestFirst = [...full30Days].reverse();
    newestFirst.forEach((day, idx) => {
      const rowFromBottom = idx % 7;
      const colFromRight = Math.floor(idx / 7);
      const row = 6 - rowFromBottom;
      const col = columnCount - 1 - colFromRight;
      if (row >= 0 && row < 7 && col >= 0 && col < columnCount) {
        const rowData = matrix[row];
        if (rowData) {
          rowData[col] = day;
        }
      }
    });

    return matrix;
  }, [full30Days, columnCount]);

  const weekdayLabels = useMemo(() => {
    if (!newestDay) return Array.from({ length: 7 }).map((_, idx) => formatWeekdayShort(idx));

    const newestWeekday = newestDay.date.getUTCDay();
    return Array.from({ length: 7 }).map((_, row) => {
      const daysBack = 6 - row;
      const weekday = (newestWeekday - daysBack + 14) % 7;
      return formatWeekdayShort(weekday);
    });
  }, [newestDay, formatWeekdayShort]);

  const monthLabels = useMemo(() => {
    return Array.from({ length: columnCount }).map((_, col) => {
      const firstDay = desktopMatrix.find((row) => row[col] !== null)?.[col];
      if (!firstDay) return "";
      return firstDay.date.toLocaleDateString(dateLocale, { month: "short" });
    });
  }, [desktopMatrix, columnCount, dateLocale]);

  const getCellClass = (day: DayCell) => {
    const isNewest = newestDay?.dateIso === day.dateIso;
    if (isNewest && day.submitted) return HEATMAP_COLORS.today;
    if (isNewest && !day.submitted) return HEATMAP_COLORS.todayMissing;
    return day.submitted ? HEATMAP_COLORS.active : HEATMAP_COLORS.empty;
  };

  const getStatusText = (submitted: boolean) =>
    submitted ? t("heatmapStatusDone") : t("heatmapStatusMissed");

  const getTooltipText = (day: DayCell) => {
    const when = day.date.toLocaleDateString(dateLocale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return `${when} — ${getStatusText(day.submitted)}`;
  };

  const renderHeatmapCell = (day: DayCell, compact = false) => (
    <Popover key={day.dateIso}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={getTooltipText(day)}
          className={`rounded-md transition-all ${getCellClass(day)} ${compact ? "h-5 w-5" : "h-6 w-6"}`}
          aria-label={getTooltipText(day)}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto px-3 py-2 text-xs">
        {getTooltipText(day)}
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="w-full space-y-4">
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground text-center">
          {t("attendanceLast7Days")}
        </h3>
        <div className="flex flex-wrap justify-center sm:justify-between items-center bg-card border rounded-[2rem] p-4 py-5 shadow-sm gap-2">
          {last7Days.map((day, i) => {
            const isToday = i === last7Days.length - 1;
            const dayName = day.date.toLocaleDateString(dateLocale, { weekday: "short" });

            return (
              <div key={day.dateIso} className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 transition-all ${
                    day.submitted
                      ? "border-orange-500 bg-orange-100 dark:bg-orange-950/40 text-orange-500 shadow-inner"
                      : "border-dashed border-muted bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {day.submitted ? (
                    isToday ? (
                      <Flame className="h-5 w-5 sm:h-6 sm:w-6 fill-orange-500 text-orange-500 animate-pulse" />
                    ) : (
                      <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                    )
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    isToday ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
                  }`}
                >
                  {isToday ? t("today") : dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">{t("attendanceLast30Days")}</h4>
        </div>

        <div className="md:hidden">
          <div className="grid grid-cols-7 gap-1.5 justify-center">
            {mobile28Days.map((day) => renderHeatmapCell(day, true))}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="mb-2 flex gap-1.5 ps-12">
            {monthLabels.map((month, idx) => (
              <div key={`month-${idx}`} className="w-6 text-[10px] text-muted-foreground text-center">
                {month}
              </div>
            ))}
          </div>

          <div className="grid gap-1.5" style={{ gridTemplateColumns: `auto repeat(${columnCount}, minmax(0, 1fr))` }}>
            {desktopMatrix.map((row, rowIndex) => (
              <Fragment key={`row-${rowIndex}`}>
                <div className="w-10 text-[10px] text-muted-foreground self-center">{weekdayLabels[rowIndex]}</div>
                {row.map((day, colIndex) =>
                  day ? (
                    <div key={day.dateIso} className="flex justify-center">
                      {renderHeatmapCell(day)}
                    </div>
                  ) : (
                    <div key={`empty-${rowIndex}-${colIndex}`} className="h-6 w-6 rounded-md bg-transparent" />
                  ),
                )}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1 text-sm">
          <p className="font-semibold text-orange-600 dark:text-orange-400">
            {t("heatmapActiveDays", { count: activeDaysCount })}
          </p>
          <p className="text-muted-foreground">{t("heatmapLongestStreak", { count: longestStreak })}</p>
        </div>
      </div>
    </div>
  );
}
