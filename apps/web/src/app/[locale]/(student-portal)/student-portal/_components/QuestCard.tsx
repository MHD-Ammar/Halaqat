"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import { type QuestWithCompletion } from "@/hooks/use-student-quests";

interface QuestCardProps {
  quest: QuestWithCompletion;
  onComplete: (questId: string) => Promise<void>;
  isSubmitting: boolean;
}

export function QuestCard({ quest, onComplete, isSubmitting }: QuestCardProps) {
  const tQuestCategory = useTranslations("QuestCategory");
  const [isPending, setIsPending] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  // If the quest becomes completed organically (e.g. from parent re-render), 
  // clear pending state.
  useEffect(() => {
    if (quest.isCompleted) {
      setIsPending(false);
    }
  }, [quest.isCompleted]);

  const handleComplete = async () => {
    if (quest.isCompleted || isSubmitting || isPending) return;
    
    setIsPending(true);
    try {
      await onComplete(quest.id);
      setJustCompleted(true);
      // Remove the "just completed" highlight after animation finishes
      setTimeout(() => setJustCompleted(false), 2000);
    } catch {
      // Error is handled upstream
    } finally {
      setIsPending(false);
    }
  };

  const showAsCompleted = quest.isCompleted || justCompleted;

  return (
    <motion.button
      type="button"
      layout="position"
      whileTap={!showAsCompleted && !isSubmitting && !isPending ? { scale: 0.97 } : undefined}
      disabled={showAsCompleted || isSubmitting || isPending}
      onClick={handleComplete}
      animate={
        justCompleted
          ? { scale: [1, 0.95, 1.02, 1] }
          : undefined
      }
      transition={
        justCompleted 
          ? { type: "spring", stiffness: 500, damping: 15, duration: 0.5 }
          : undefined
      }
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
              animate={justCompleted ? { scale: [1, 1.3, 1] } : undefined}
              transition={{ delay: 0.1, duration: 0.4 }}
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm ${
                showAsCompleted
                  ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white"
                  : "bg-gradient-to-r from-amber-400 to-yellow-500 text-white animate-pulse"
              }`}
            >
              +{quest.xpReward} XP
            </motion.div>
          </div>
          
          {quest.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground/80 leading-relaxed">
              {quest.description}
            </p>
          )}

          {/* Category Badge (optional, small context) */}
          <div className="mt-1">
            <span className="inline-block rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground dark:bg-muted/40">
              {tQuestCategory(quest.category)}
            </span>
          </div>
        </div>

        {/* Action / Status Area */}
        <div className="shrink-0 pl-1 relative flex items-center justify-center h-10 w-10">
          <AnimatePresence mode="wait">
            {isPending ? (
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
                key="todo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="relative flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 bg-white text-amber-500 dark:border-amber-700 dark:bg-amber-950/40"
              >
                {/* Pulsing ring animation for the CTA */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-amber-400/60 dark:border-amber-500/40"
                  animate={{ 
                    boxShadow: ["0 0 0 0px rgba(251, 191, 36, 0.4)", "0 0 0 8px rgba(251, 191, 36, 0)"],
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeOut" 
                  }}
                />
                <Circle className="h-4 w-4 relative z-10" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );
}
