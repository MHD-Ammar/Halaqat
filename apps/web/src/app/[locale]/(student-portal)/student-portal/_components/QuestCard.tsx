"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo } from "react";

import { type QuestWithCompletion, useLogQuestProgress } from "@/hooks/use-student-quests";
import { soundManager } from "@/lib/sounds";

interface QuestCardProps {
  quest: QuestWithCompletion;
  onComplete: (questId: string) => Promise<void>;
  isSubmitting: boolean;
  streakMultiplier?: number;
}

export function QuestCard({ quest, onComplete, isSubmitting, streakMultiplier = 1.0 }: QuestCardProps) {
  const tQuestCategory = useTranslations("QuestCategory");
  const t = useTranslations("StudentPortal");
  const [isPending, setIsPending] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const { mutateAsync: logProgress, isPending: isLoggingProgress } = useLogQuestProgress();

  // If the quest becomes completed organically (e.g. from parent re-render), 
  // clear pending state.
  useEffect(() => {
    if (quest.isCompleted) {
      setIsPending(false);
    }
  }, [quest.isCompleted]);

  const handleLogProgress = async (amount: number = 1) => {
    if (quest.isCompleted || isSubmitting || isPending || isLoggingProgress) return;
    
    setIsPending(true);
    try {
      const result = await logProgress({ questId: quest.id, amount });
      if (result.justCompleted) {
        void soundManager.play("questComplete");
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 2000);
      } else {
        void soundManager.play("loginBonus"); // Short satisfying sound for progress
      }
    } catch {
      void soundManager.play("error");
    } finally {
      setIsPending(false);
    }
  };

  const handleComplete = async () => {
    if (quest.isCompleted || isSubmitting || isPending || isLoggingProgress) return;
    
    if (quest.target > 1) {
      handleLogProgress(1);
      return;
    }

    setIsPending(true);
    try {
      await onComplete(quest.id);
      void soundManager.play("questComplete");
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 2000);
    } catch {
      void soundManager.play("error");
    } finally {
      setIsPending(false);
    }
  };

  const showAsCompleted = quest.isCompleted || justCompleted;
  const isMultiStep = quest.target > 1;
  const progressPercent = useMemo(() => {
    if (showAsCompleted) return 100;
    return Math.min(Math.round((quest.currentProgress / quest.target) * 100), 100);
  }, [quest.currentProgress, quest.target, showAsCompleted]);

  return (
    <motion.button
      type="button"
      layout="position"
      {...(!showAsCompleted && !isSubmitting && !isPending && !isLoggingProgress
        ? { whileTap: { scale: 0.97 } }
        : {})}
      disabled={showAsCompleted || isSubmitting || (isPending && !isMultiStep)}
      onClick={handleComplete}
      {...(justCompleted ? { animate: { scale: [1, 0.95, 1.02, 1] } } : {})}
      {...(justCompleted
        ? { transition: { type: "spring", stiffness: 500, damping: 15, duration: 0.5 } }
        : {})}
      className={`relative w-full text-left rounded-2xl border p-4 transition-all duration-300 ${
        showAsCompleted
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50/50 text-emerald-950 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-green-950/20 dark:text-emerald-100"
          : "border-gray-200 bg-card hover:border-amber-300/60 hover:shadow-md dark:border-gray-800 dark:bg-card dark:hover:border-amber-700/50"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Icon Area */}
        <div 
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl transition-colors duration-500 ${
            showAsCompleted
              ? "bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/50 dark:to-green-900/30"
              : "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20"
          }`}
        >
          <span>{quest.icon || "⭐"}</span>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base truncate leading-tight">
              {quest.title}
            </h3>
            
            {/* XP Badge */}
            <motion.div 
              {...(justCompleted ? { animate: { scale: [1, 1.3, 1] } } : {})}
              transition={{ delay: 0.1, duration: 0.4 }}
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm flex items-center gap-1 ${
                showAsCompleted
                  ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white"
                  : "bg-gradient-to-r from-amber-400 to-yellow-500 text-white"
              } ${!showAsCompleted && streakMultiplier > 1.0 ? "animate-pulse" : ""}`}
            >
              {streakMultiplier > 1.0 ? (
                <>
                  <span className="text-[10px]">🔥</span>
                  <span>+{quest.xpReward} × {streakMultiplier} = </span>
                  <span className="text-sm font-black">{Math.round(quest.xpReward * streakMultiplier)} {t("xp")}</span>
                </>
              ) : (
                <>+{quest.xpReward} {t("xp")}</>
              )}
            </motion.div>
          </div>
          
          {quest.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground/80 leading-relaxed">
              {quest.description}
            </p>
          )}

          {/* Progress Bar for Multi-Step Quests */}
          {isMultiStep && !showAsCompleted && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-muted-foreground uppercase tracking-wider">
                  {t("progress")}
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  {quest.currentProgress} / {quest.target} {quest.targetUnit || ""}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                />
              </div>
            </div>
          )}

          {/* Category Badge */}
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-block rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground dark:bg-muted/40">
              {tQuestCategory(quest.category)}
            </span>
            {isMultiStep && !showAsCompleted && (
              <span className="text-[10px] font-bold text-amber-600/80 dark:text-amber-400/80">
                • {t("multiStepQuest")}
              </span>
            )}
          </div>
        </div>

        {/* Action Area */}
        <div className="shrink-0 pl-1 relative flex items-center justify-center gap-2">
          {isMultiStep && !showAsCompleted && (
            <button
              type="button"
              disabled={isPending || isLoggingProgress}
              onClick={(e) => {
                e.stopPropagation();
                handleLogProgress(1);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}

          <div className="relative flex items-center justify-center h-10 w-10">
            <AnimatePresence mode="wait">
              {isPending || isLoggingProgress ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="text-amber-500"
                >
                  <Loader2 className="h-6 w-6 animate-spin" />
                </motion.div>
              ) : showAsCompleted ? (
                <motion.div
                  key="completed"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
                >
                  <Check className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="circle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-300 dark:text-gray-700"
                >
                  <Circle className="h-8 w-8" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
