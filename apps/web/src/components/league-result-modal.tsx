"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowUp, Minus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

import { Button } from "@/components/ui/button";
import { type LastWeekLeagueResultResponse } from "@/hooks/use-student-portal";
import { soundManager } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface LeagueResultModalProps {
  isOpen: boolean;
  resultData: LastWeekLeagueResultResponse | null;
  onClose: () => void;
}

export function LeagueResultModal({ isOpen, resultData, onClose }: LeagueResultModalProps) {
  const t = useTranslations("StudentPortal");
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateWindowSize();
    window.addEventListener("resize", updateWindowSize);
    return () => window.removeEventListener("resize", updateWindowSize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      void soundManager.play("leagueResult");
    }
  }, [isOpen]);

  if (!resultData) return null;

  const isPromoted = resultData.result === "promoted";
  const isRelegated = resultData.result === "relegated";
  const isStayed = resultData.result === "stayed";

  const title = isPromoted
    ? t("leagueResultPromotedTitle", { tier: resultData.toTier.nameAr })
    : isRelegated
      ? t("leagueResultRelegatedTitle", { tier: resultData.toTier.nameAr })
      : t("leagueResultStayedTitle", { tier: resultData.toTier.nameAr });

  const description = isPromoted
    ? t("leagueResultPromotedDesc")
    : isRelegated
      ? t("leagueResultRelegatedDesc")
      : t("leagueResultStayedDesc");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {isPromoted && (
            <div className="pointer-events-none fixed inset-0 z-[101]">
              <Confetti
                width={windowSize.width}
                height={windowSize.height}
                recycle={false}
                numberOfPieces={300}
                gravity={0.15}
              />
            </div>
          )}

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
              "relative z-[102] w-full max-w-md overflow-hidden rounded-[2.5rem] border-4 p-8 text-center shadow-2xl",
              isPromoted && "border-emerald-400/30 bg-gradient-to-b from-white to-emerald-50 dark:from-slate-900 dark:to-emerald-950/40",
              isRelegated && "border-rose-400/30 bg-gradient-to-b from-white to-rose-50 dark:from-slate-900 dark:to-rose-950/40",
              isStayed && "border-amber-400/30 bg-gradient-to-b from-white to-amber-50 dark:from-slate-900 dark:to-amber-950/40",
            )}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute end-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Visual Header */}
            <div className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="absolute inset-0 rounded-full bg-white/80 blur-2xl dark:bg-amber-500/10"
              />
              <motion.span
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative z-10 text-7xl filter drop-shadow-xl"
              >
                {resultData.toTier.icon}
              </motion.span>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight"
            >
              {title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-base font-medium text-slate-600 dark:text-slate-400 px-2"
            >
              {description}
            </motion.p>

            {/* Stats Comparison */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="flex items-center justify-between p-4 px-8">
                <div className="flex flex-col items-center">
                  <span className="text-2xl mb-1 grayscale opacity-50">{resultData.fromTier.icon}</span>
                  <span className="text-[10px] font-black uppercase text-slate-500">{resultData.fromTier.nameAr}</span>
                </div>
                
                <div className="flex flex-col items-center px-4">
                  {isPromoted && <ArrowUp className="h-6 w-6 text-emerald-500 animate-bounce" />}
                  {isRelegated && <ArrowDown className="h-6 w-6 text-rose-500 animate-bounce" />}
                  {isStayed && <Minus className="h-6 w-6 text-amber-500" />}
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-1">{resultData.toTier.icon}</span>
                  <span className="text-[10px] font-black uppercase text-amber-600">{resultData.toTier.nameAr}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-slate-200 bg-white/50 dark:divide-slate-800 dark:bg-black/20 p-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">{t("rank")}</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">#{resultData.finalRank ?? "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">{t("xp")}</p>
                  <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{resultData.weeklyXp}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8"
            >
              <Button
                onClick={onClose}
                size="lg"
                className="h-14 w-full rounded-2xl text-lg font-black tracking-wide shadow-xl shadow-amber-500/20 transition-transform active:scale-95 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
              >
                {t("continueJourney")}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
