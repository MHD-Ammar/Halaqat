"use client";

import type { QuestCategory } from "@halaqat/types";
import { motion } from "framer-motion";
import { Check, Circle, Flame, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AchievementUnlockedModal } from "@/components/achievement-unlocked-modal";
import { LevelUpModal } from "@/components/level-up-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type Achievement } from "@/hooks/use-student-achievements";
import { useCompleteQuest, useStudentQuests } from "@/hooks/use-student-quests";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";

interface StudentProfile {
  id: string;
  name: string;
  currentLevel?: number;
  currentStreak?: number;
  totalXp?: number;
}

export default function QuestsPage() {
  const t = useTranslations();
  const tQuestCategory = useTranslations("QuestCategory");
  const { toast } = useToast();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { data: groupedQuests, isLoading: isQuestsLoading } = useStudentQuests();
  const completeQuestMutation = useCompleteQuest();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({
    newLevel: 0,
    earnedXp: 0,
    newTotalXp: 0,
  });
  const [showAchievements, setShowAchievements] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);

  const student = profile as unknown as StudentProfile | undefined;
  const isLoading = isProfileLoading || isQuestsLoading;

  const handleCompleteQuest = async (questId: string) => {
    if (isSubmitting || completeQuestMutation.isPending) return;
    setIsSubmitting(true);

    try {
      const result = await completeQuestMutation.mutateAsync(questId);

      // Show success toast
      toast({
        title: t("Quests.submissionSuccess"),
        description: t("Quests.earnedXpDescription", { xp: result.earnedXp }),
      });

      // Show level-up modal if applicable
      if (result.levelUp) {
        setLevelUpData({
          newLevel: result.newLevel,
          earnedXp: result.earnedXp,
          newTotalXp: result.newTotalXp,
        });
        setShowLevelUp(true);
      }

      // Show achievements modal if applicable
      if (result.newAchievements && result.newAchievements.length > 0) {
        setUnlockedAchievements(result.newAchievements);
        setShowAchievements(true);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError?.response?.data?.message || t("Common.error");
      toast({
        title: t("Common.error"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {t("Quests.habitTracker")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t("Quests.submitTodaysQuests")}
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">{t("Gamification.xp")}</span>
              </div>
              <p className="text-2xl font-bold">{student?.totalXp ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                <span className="text-sm font-medium">{t("Gamification.level")}</span>
              </div>
              <p className="text-2xl font-bold">{student?.currentLevel ?? 1}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 mb-2">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-medium">{t("Gamification.streak")}</span>
              </div>
              <p className="text-2xl font-bold">{student?.currentStreak ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habit Sections */}
      <div className="space-y-4">
        {groupedQuests &&
          (Object.keys(groupedQuests) as QuestCategory[]).map((category) => {
            const quests = groupedQuests[category] ?? [];
            if (!quests.length) return null;

            return (
              <section key={category} className="space-y-3">
                <h2 className="text-lg font-semibold">
                  {tQuestCategory(category)}
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {quests.map((quest) => {
                    const isCompleted = quest.isCompleted;
                    return (
                      <motion.button
                        key={quest.id}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        disabled={isCompleted || isSubmitting || completeQuestMutation.isPending}
                        onClick={() => handleCompleteQuest(quest.id)}
                        className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                          isCompleted
                            ? "border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/60"
                            : "border-gray-200 bg-card hover:border-amber-300 hover:bg-amber-50/60 dark:border-gray-800 dark:bg-card dark:hover:border-amber-600/60 dark:hover:bg-amber-900/10"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Icon */}
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg dark:bg-amber-900/40">
                            <span>{quest.icon || "⭐"}</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold truncate">{quest.title}</p>
                              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                +{quest.xpReward} XP
                              </span>
                            </div>
                            {quest.description && (
                              <p className="line-clamp-2 text-xs text-muted-foreground">
                                {quest.description}
                              </p>
                            )}
                          </div>

                          {/* Status Circle */}
                          <div className="shrink-0">
                            {isCompleted ? (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                                <Check className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 bg-white text-amber-500 dark:border-amber-700 dark:bg-amber-950/40">
                                <Circle className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </section>
            );
          })}

        {groupedQuests && Object.values(groupedQuests).every((qs) => !qs?.length) && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("Quests.noQuestsAvailable")}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Level Up Modal */}
      <LevelUpModal
        isOpen={showLevelUp}
        newLevel={levelUpData.newLevel}
        earnedXp={levelUpData.earnedXp}
        newTotalXp={levelUpData.newTotalXp}
        onClose={() => setShowLevelUp(false)}
      />

      {/* Achievement Unlocked Modal */}
      <AchievementUnlockedModal
        isOpen={showAchievements}
        achievements={unlockedAchievements}
        onClose={() => setShowAchievements(false)}
      />
    </div>
  );
}
