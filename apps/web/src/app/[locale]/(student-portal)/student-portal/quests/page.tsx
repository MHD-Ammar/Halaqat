"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AchievementUnlockedModal } from "@/components/achievement-unlocked-modal";
import { LevelUpModal } from "@/components/level-up-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Achievement } from "@/hooks/use-student-achievements";
import { QuestWithCompletion, useCompleteQuest, useStudentQuests } from "@/hooks/use-student-quests";
import { useToast } from "@/hooks/use-toast";

import { QuestCard } from "../_components/QuestCard";

export default function QuestsPage() {
  const t = useTranslations();
  const { toast } = useToast();
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

  const handleCompleteQuest = async (questId: string) => {
    if (isSubmitting || completeQuestMutation.isPending) return;
    setIsSubmitting(true);

    try {
      const result = await completeQuestMutation.mutateAsync(questId);

      toast({
        title: t("Quests.submissionSuccess"),
        description: t("Quests.earnedXpDescription", { xp: result.earnedXp }),
      });

      if (result.levelUp) {
        setLevelUpData({
          newLevel: result.newLevel,
          earnedXp: result.earnedXp,
          newTotalXp: result.newTotalXp,
        });
        setShowLevelUp(true);
      }

      if (result.newAchievements && result.newAchievements.length > 0) {
        setUnlockedAchievements(result.newAchievements as Achievement[]);
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

  if (isQuestsLoading) {
    return <QuestsPageSkeleton />;
  }

  // Regroup quests into our 3 Tabs: Daily, Halqah, Extra
  const allQuests: QuestWithCompletion[] = groupedQuests 
    ? Object.values(groupedQuests).flat() 
    : [];

  const tabData = {
    daily: allQuests.filter((q) => q.frequency === "DAILY" && !q.circleId),
    halqah: allQuests.filter((q) => q.circleId !== null),
    extra: allQuests.filter(
      (q) => (q.frequency === "WEEKLY" || q.frequency === "ONETIME") && !q.circleId
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-10">
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">
            {t("Quests.habitTracker")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("Quests.submitTodaysQuests")}
          </p>
        </div>

        {/* Tabs Interface */}
        <Tabs defaultValue="daily" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-3 h-12 rounded-2xl bg-muted/50 p-1 mb-6">
            <TabsTrigger value="daily" className="rounded-xl data-[state=active]:shadow-md text-sm md:text-base transition-all">
              🌅 {t("Quests.dailyTab")}
              {tabData.daily.filter(q => !q.isCompleted).length > 0 && (
                <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="halqah" className="rounded-xl data-[state=active]:shadow-md text-sm md:text-base transition-all">
              📖 {t("Quests.halqahTab")}
              {tabData.halqah.filter(q => !q.isCompleted).length > 0 && (
                <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="extra" className="rounded-xl data-[state=active]:shadow-md text-sm md:text-base transition-all">
              🎯 {t("Quests.extraTab")}
              {tabData.extra.filter(q => !q.isCompleted).length > 0 && (
                <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <QuestList 
              quests={tabData.daily} 
              onComplete={handleCompleteQuest} 
              isSubmitting={isSubmitting || completeQuestMutation.isPending} 
            />
          </TabsContent>
          
          <TabsContent value="halqah" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <QuestList 
               quests={tabData.halqah} 
               onComplete={handleCompleteQuest} 
               isSubmitting={isSubmitting || completeQuestMutation.isPending} 
            />
          </TabsContent>
          
          <TabsContent value="extra" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <QuestList 
               quests={tabData.extra} 
               onComplete={handleCompleteQuest} 
               isSubmitting={isSubmitting || completeQuestMutation.isPending} 
            />
          </TabsContent>
        </Tabs>

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
      </motion.div>
    </div>
  );
}

// Helper component to render the list
function QuestList({ 
  quests, 
  onComplete, 
  isSubmitting 
}: { 
  quests: QuestWithCompletion[], 
  onComplete: (id: string) => Promise<void>,
  isSubmitting: boolean
}) {
  const t = useTranslations();
  
  if (quests.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-16 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-6xl mb-6">🏆</div>
        <h3 className="text-xl font-bold text-foreground">
          {t("Quests.allDoneHero")}
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
          {t("Quests.allDoneSubtext")}
        </p>
      </motion.div>
    );
  }

  // Sort: uncompleted first, then completed. Stable otherwise.
  const sortedQuests = [...quests].sort((a, b) => {
    if (a.isCompleted === b.isCompleted) return 0;
    return a.isCompleted ? 1 : -1;
  });

  return (
    <motion.div
      className="grid gap-3 md:grid-cols-2"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {sortedQuests.map((quest) => (
        <motion.div
          key={quest.id}
          layout
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
          }}
        >
          <QuestCard 
            quest={quest} 
            onComplete={onComplete} 
            isSubmitting={isSubmitting} 
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Skeleton Loader
function QuestsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header text skeleton */}
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>

      {/* Tab skeleton */}
      <Skeleton className="h-12 w-full rounded-2xl mb-6" />
      
      {/* Card skeletons */}
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border p-4 bg-card">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

