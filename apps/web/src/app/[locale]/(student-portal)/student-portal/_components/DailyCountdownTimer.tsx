"use client";

import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState, useMemo } from "react";

interface DailyCountdownTimerProps {
  hasSubmittedToday: boolean;
  variant?: "cta" | "compact" | "banner";
}

export function DailyCountdownTimer({
  hasSubmittedToday,
  variant = "cta",
}: DailyCountdownTimerProps) {
  const t = useTranslations("DailyCountdown");
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 1, // Start > 0 to prevent immediate refresh flash on mount
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    function calculateTime() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0); // Local midnight
      
      const diff = midnight.getTime() - now.getTime();
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        totalSeconds: Math.floor(diff / 1000),
      };
    }

    setTimeLeft(calculateTime());

    const timer = setInterval(() => {
      const newTime = calculateTime();
      setTimeLeft(newTime);

      if (newTime.totalSeconds <= 0 && newTime.totalSeconds > -5) {
        // Trigger React Query cache invalidation
        queryClient.invalidateQueries({ queryKey: ["student-portal-dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["student-quests"] });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [queryClient]);

  const formatTimeStr = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US");
    
    const hStr = formatter.format(Math.max(0, timeLeft.hours));
    const mStr = formatter.format(Math.max(0, timeLeft.minutes));
    const sStr = formatter.format(Math.max(0, timeLeft.seconds));
    
    const { hours, totalSeconds } = timeLeft;
    const showSeconds = totalSeconds < 300 && totalSeconds > 0;

    if (hours > 0) {
      if (showSeconds) {
        return t("timeHms", { h: hStr, m: mStr, s: sStr });
      }
      return t("timeHm", { h: hStr, m: mStr });
    } else {
      if (showSeconds) {
        return t("timeMs", { m: mStr, s: sStr });
      }
      return t("timeM", { m: mStr });
    }
  }, [timeLeft, locale, t]);

  if (!mounted) return null;

  if (hasSubmittedToday) {
    if (variant === "cta") return null;
    if (variant === "compact") return null;
    if (variant === "banner") return null;
  }

  const { totalSeconds } = timeLeft;

  // Render refreshing state at midnight
  if (totalSeconds <= 0) {
    if (variant === "compact") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium border border-slate-200 dark:border-slate-700 animate-pulse mt-2">
          🔄 {t("refreshing")}
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 animate-pulse ${variant === "banner" ? "w-full mb-6" : "w-full max-w-sm mx-auto"}`}>
        🔄 {t("refreshing")}
      </div>
    );
  }

  let tier: "normal" | "warning" | "critical" = "normal";
  if (totalSeconds <= 2 * 60 * 60) {
    tier = "critical";
  } else if (totalSeconds <= 6 * 60 * 60) {
    tier = "warning";
  }

  type TierConfig = {
    bg: string;
    border: string;
    text: string;
    icon: string;
    msg: string;
    animationProps: {
      animate?: Record<string, unknown>;
      transition?: Record<string, unknown>;
    };
  };

  const configs: Record<"normal" | "warning" | "critical", TierConfig> = {
    normal: {
      bg: "bg-slate-50 dark:bg-slate-800/50",
      border: "border-slate-200 dark:border-slate-700",
      text: "text-slate-600 dark:text-slate-400",
      icon: "⏰",
      msg: t("normal", { time: formatTimeStr }),
      animationProps: {},
    },
    warning: {
      bg: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40",
      border: "border-amber-300 dark:border-amber-700/60",
      text: "text-amber-700 dark:text-amber-400",
      icon: "⏰",
      msg: t("warning", { time: formatTimeStr }),
      animationProps: {
        animate: { boxShadow: ["0px 0px 0px rgba(245, 158, 11, 0)", "0px 0px 15px rgba(245, 158, 11, 0.2)", "0px 0px 0px rgba(245, 158, 11, 0)"] },
        transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
      },
    },
    critical: {
      bg: "bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/40",
      border: "border-red-400 dark:border-red-600/60 shadow-red-500/30",
      text: "text-red-700 dark:text-red-400 font-bold",
      icon: "🚨",
      msg: t("critical", { time: formatTimeStr }),
      animationProps: {
        animate: { scale: [1, 1.02, 1], boxShadow: ["0px 0px 0px rgba(239, 68, 68, 0)", "0px 0px 20px rgba(239, 68, 68, 0.4)", "0px 0px 0px rgba(239, 68, 68, 0)"] },
        transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
      },
    }
  };

  const config = configs[tier as keyof typeof configs];
  
  // Compact has a specific translation string wrapper
  const message = variant === "compact" ? t("compact", { time: formatTimeStr }) : config.msg;

  if (variant === "compact") {
    return (
      <AnimatePresence mode="wait">
        <motion.div 
          key={tier}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0, ...(tier === 'critical' ? config.animationProps.animate : {}) }}
          transition={{ ...(tier === 'critical' ? config.animationProps.transition : { duration: 0.3 }) }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full text-sm font-medium border ${config.bg} ${config.border} ${config.text}`}
        >
          <span>{config.icon}</span>
          <span>{message}</span>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tier}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1, ...config.animationProps.animate }}
        transition={config.animationProps.transition || { duration: 0.3 }}
        className={`flex items-center justify-center gap-2 p-3 rounded-xl border ${config.bg} ${config.border} ${config.text} ${variant === "banner" ? "w-full mb-6" : "w-full max-w-sm mx-auto"}`}
      >
        <span className="text-lg">{config.icon}</span>
        <span className="font-semibold text-center">{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}
