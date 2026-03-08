"use client";

import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface StreakShieldIndicatorProps {
  shields: number;
  maxShields: number;
  lastShieldUsedAt: string | null;
}

export function StreakShieldIndicator({
  shields,
  maxShields = 3,
  lastShieldUsedAt,
}: StreakShieldIndicatorProps) {
  const t = useTranslations("StudentPortal");
  const [recentlyUsed, setRecentlyUsed] = useState(false);

  useEffect(() => {
    if (lastShieldUsedAt) {
      const usedAt = new Date(lastShieldUsedAt);
      const now = new Date();
      const diffMs = now.getTime() - usedAt.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours < 24) {
        setRecentlyUsed(true);
      }
    }
  }, [lastShieldUsedAt]);

  const shieldArray = Array.from({ length: maxShields });

  return (
    <div className="flex w-full flex-col items-center space-y-2 rounded-[2rem] bg-card p-4 shadow-sm border mt-4">
      <div className="flex items-center gap-3">
        {shieldArray.map((_, index) => {
          const isOwned = index < shields;
          return (
            <div
              key={index}
              className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition-all ${
                isOwned
                  ? "bg-blue-100/50 text-blue-500 shadow-inner dark:bg-blue-900/30"
                  : "bg-muted/30 text-muted-foreground/30 border-2 border-dashed border-muted"
              }`}
            >
              <Shield
                className={`h-6 w-6 sm:h-7 sm:w-7 ${
                  isOwned ? "fill-blue-500 text-blue-500" : ""
                }`}
              />
            </div>
          );
        })}
      </div>

      {recentlyUsed && (
        <p className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-sm font-semibold text-orange-600 dark:text-orange-400">
          {t("shieldUsed")}
        </p>
      )}

      <p className="text-[11px] sm:text-xs text-muted-foreground text-center">
        {t("shieldInfo")}
      </p>
    </div>
  );
}
