"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface XpProgressBarProps {
  totalXp: number;
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpProgress: number; // 0-100
  xpToNextLevel: number;
}

const toArabic = (num: number) => {
  return new Intl.NumberFormat("ar-EG").format(num);
};

export function XpProgressBar({
  totalXp,
  currentLevel,
  nextLevelXp,
  xpProgress,
  xpToNextLevel,
}: XpProgressBarProps) {
  const t = useTranslations("StudentPortal");
  const c = useTranslations("Common");
  const isMaxLevel = xpToNextLevel <= 0;
  const isCloseToNext = xpProgress >= 90 && !isMaxLevel;

  // For radial SVG
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.max(0, Math.min(xpProgress, 100)) / 100) * circumference;

  return (
    <Card className={cn(
      "relative overflow-hidden rounded-3xl border-0 shadow-lg text-white mb-8",
      isMaxLevel 
        ? "bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 shadow-amber-500/20"
        : "bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 shadow-indigo-500/20",
      isCloseToNext && "shadow-fuchsia-500/40"
    )}>
      {/* Decorative back-glow if close to level up */}
      {isCloseToNext && (
        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full mix-blend-overlay animate-pulse" />
      )}
      
      <CardContent className="p-6 relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
        {/* Radial Ring */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <svg width="120" height="120" viewBox="0 0 120 120" className="rotate-[-90deg]">
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-black/10"
            />
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              stroke="url(#xpGradient)"
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={isMaxLevel ? "#FEF08A" : "#FDBA74"} />
                <stop offset="100%" stopColor={isMaxLevel ? "#FDE047" : "#FDA4AF"} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-medium text-white/80 uppercase tracking-widest drop-shadow-md">
              {t("levelLabel", { defaultValue: "المستوى" })}
            </span>
            <span className="text-3xl font-black drop-shadow-md text-white">
              {toArabic(currentLevel)}
            </span>
          </div>
        </div>

        {/* Linear Progress and Info */}
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-bold flex items-center gap-2 drop-shadow-md">
                {isMaxLevel ? (
                  <>
                    <Trophy className="w-5 h-5 text-yellow-200" />
                    {t("maxLevelReached")}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-200" />
                    {isCloseToNext ? t("closeToNextLevel") : t("levelProgress")}
                  </>
                )}
              </h3>
              {!isMaxLevel && (
                <p className="text-white/90 font-medium drop-shadow-sm">
                  {t("xpRemaining", { xp: toArabic(xpToNextLevel), nextLevel: toArabic(currentLevel + 1) })}
                </p>
              )}
            </div>
            
            <div className="text-end font-bold text-lg tabular-nums drop-shadow-md">
              {isMaxLevel ? (
                <span>{c("max")}</span>
              ) : (
                <span dir="ltr" className="inline-block">
                  {toArabic(totalXp)} / {toArabic(nextLevelXp)} XP
                </span>
              )}
            </div>
          </div>

          <div className="h-4 w-full bg-black/20 rounded-full overflow-hidden relative shadow-inner">
            <motion.div
              className={cn(
                "h-full rounded-full relative",
                isMaxLevel 
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-200"
                  : "bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(xpProgress, 100))}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.2 }}
            >
              {/* Highlight effect over the bar */}
              <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-b from-white/30 to-transparent" />
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

