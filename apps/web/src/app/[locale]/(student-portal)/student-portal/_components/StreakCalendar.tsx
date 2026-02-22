"use client";

import { Check, Flame } from "lucide-react";

interface StreakCalendarProps {
  streakCalendar: Record<string, boolean>;
}

export function StreakCalendar({ streakCalendar }: StreakCalendarProps) {
  const dates = Object.keys(streakCalendar).sort();
  
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">سجل الحضور في آخر 7 أيام</h3>
      <div className="flex flex-wrap justify-center sm:justify-between items-center bg-card border rounded-[2rem] p-4 py-5 shadow-sm gap-2">
        {dates.map((date, i) => {
          const isSubmitted = streakCalendar[date];
          const isToday = i === dates.length - 1;
          const dayName = new Date(date).toLocaleDateString("ar-SA", { weekday: "short" });
          
          return (
            <div key={date} className="flex flex-col items-center gap-2">
              <div
                className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border-2 transition-all ${
                  isSubmitted
                    ? "border-orange-500 bg-orange-100 dark:bg-orange-950/40 text-orange-500 shadow-inner"
                    : "border-dashed border-muted bg-muted/30 text-muted-foreground"
                }`}
              >
                {isSubmitted ? (
                  isToday ? (
                    <Flame className="h-6 w-6 sm:h-7 sm:w-7 fill-orange-500 text-orange-500 animate-pulse" />
                  ) : (
                    <Check className="h-6 w-6 sm:h-7 sm:w-7" />
                  )
                ) : (
                  <span className="text-sm font-bold">{i + 1}</span>
                )}
              </div>
              <span className={`text-[11px] sm:text-xs font-semibold ${isToday ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`}>
                {isToday ? "اليوم" : dayName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
