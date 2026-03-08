"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentAchievements } from "@/hooks/use-student-achievements";

export default function TrophyRoomPage() {
  const t = useTranslations("StudentPortal");
  const locale = useLocale();
  const { data: achievements, isLoading } = useStudentAchievements();

  const RARITY_CONFIG = {
    COMMON: {
      label: t("rarity_common"),
      borderColor: "border-gray-300 dark:border-gray-600",
      bgGradient: "from-gray-50 to-gray-100/50 dark:from-gray-900/30 dark:to-gray-800/10",
      glowClass: "",
      badgeBg: "bg-gray-200 dark:bg-gray-700",
      textColor: "text-gray-700 dark:text-gray-300",
      icon: "🥉",
    },
    RARE: {
      label: t("rarity_rare"),
      borderColor: "border-blue-400 dark:border-blue-600",
      bgGradient: "from-blue-50 to-indigo-100/50 dark:from-blue-950/30 dark:to-indigo-900/10",
      glowClass: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
      badgeBg: "bg-gradient-to-br from-blue-300 to-indigo-500",
      textColor: "text-blue-700 dark:text-blue-300",
      icon: "🥈",
    },
    EPIC: {
      label: t("rarity_epic"),
      borderColor: "border-purple-400 dark:border-purple-600",
      bgGradient: "from-purple-50 to-fuchsia-100/50 dark:from-purple-950/30 dark:to-fuchsia-900/10",
      glowClass: "shadow-[0_0_20px_rgba(168,85,247,0.4)]",
      badgeBg: "bg-gradient-to-br from-purple-400 to-fuchsia-600",
      textColor: "text-purple-700 dark:text-purple-300",
      icon: "🥇",
    },
    LEGENDARY: {
      label: t("rarity_legendary"),
      borderColor: "border-yellow-400 dark:border-yellow-500",
      bgGradient: "from-yellow-50 via-amber-100/50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-900/10",
      glowClass: "shadow-[0_0_25px_rgba(251,191,36,0.5)] hover:shadow-[0_0_35px_rgba(251,191,36,0.7)]",
      badgeBg: "bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-500",
      textColor: "text-yellow-800 dark:text-yellow-200",
      icon: "💎",
    },
  };

  const RARITY_WEIGHT = {
    LEGENDARY: 4,
    EPIC: 3,
    RARE: 2,
    COMMON: 1,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const sortedAchievements = achievements?.sort((a, b) => {
    // Unlocked first
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;
    
    // Sort by rarity within same unlock status
    const rarityA = RARITY_WEIGHT[a.rarity] || 0;
    const rarityB = RARITY_WEIGHT[b.rarity] || 0;
    return rarityB - rarityA;
  });

  const unlockedCount = achievements?.filter((a) => a.isUnlocked).length || 0;
  const totalCount = achievements?.length || 0;

  return (
    <div className="space-y-8 pb-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent drop-shadow-sm flex items-center gap-4">
          {t("trophyRoom")}
          <span className="text-xl font-bold text-amber-600/80 bg-amber-100/50 dark:bg-amber-900/30 px-4 py-1.5 rounded-full border border-amber-200 dark:border-amber-800 tracking-wider">
            🏆 {t("achievementsCompleted", { unlocked: unlockedCount, total: totalCount })}
          </span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t("trophyRoomDesc")}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortedAchievements?.map((achievement, idx) => {
          const isUnlocked = achievement.isUnlocked;
          const rarityConfig = RARITY_CONFIG[achievement.rarity || "COMMON"];

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card 
                className={`relative h-full overflow-hidden transition-all duration-300 ${
                  isUnlocked 
                    ? `${rarityConfig.borderColor} bg-gradient-to-b ${rarityConfig.bgGradient} ${rarityConfig.glowClass} hover:-translate-y-1` 
                    : "border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                }`}
              >
                {/* Rarity Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold shadow-sm flex items-center gap-1 ${
                    isUnlocked 
                      ? `${rarityConfig.badgeBg} text-white` 
                      : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                  }`}>
                    {rarityConfig.icon} {rarityConfig.label}
                  </span>
                </div>

                <CardContent className="p-6 pt-10 flex flex-col items-center text-center h-full relative z-0">
                  {/* Badge Icon */}
                  <div className={`relative flex h-24 w-24 items-center justify-center rounded-full mb-4 transition-all duration-500 ${
                    isUnlocked 
                      ? `${rarityConfig.badgeBg} shadow-lg border-4 ${rarityConfig.borderColor}` 
                      : "bg-gray-200 dark:bg-gray-800 grayscale"
                  }`}>
                    {isUnlocked ? (
                      <span className="text-5xl drop-shadow-md">{achievement.badgeIcon || "🏆"}</span>
                    ) : (
                      <Lock className="h-8 w-8 text-gray-400" />
                    )}
                  </div>

                  {/* Text Details */}
                  <h3 className={`font-bold text-lg mb-2 ${
                    isUnlocked ? rarityConfig.textColor : "text-gray-500"
                  }`}>
                    {achievement.title}
                  </h3>
                  
                  <p className={`text-sm flex-1 ${
                    isUnlocked ? `${rarityConfig.textColor} opacity-80` : "text-gray-400"
                  }`}>
                    {achievement.description}
                  </p>

                  {/* Progress & Date Section */}
                  <div className="w-full mt-4 pt-4 border-t border-gray-200 dark:border-gray-800/50 flex flex-col gap-2">
                    {isUnlocked && achievement.unlockedAt ? (
                      <div className={`text-xs font-medium ${rarityConfig.textColor}`}>
                        {t("unlockedAt", { 
                          date: new Date(achievement.unlockedAt).toLocaleDateString(
                            locale === "ar" ? "ar-SA" : "en-US"
                          ) 
                        })}
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                          <span>{t("progress")}</span>
                          <span>
                            {achievement.criteriaType === "TOTAL_XP" 
                              ? t("progress_xp", { current: achievement.currentProgress, target: achievement.criteriaTarget })
                              : achievement.criteriaType === "STREAK_DAYS"
                              ? t("progress_days", { current: achievement.currentProgress, target: achievement.criteriaTarget })
                              : t("progress_quests", { current: achievement.currentProgress, target: achievement.criteriaTarget })
                            }
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-gray-400 dark:bg-gray-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${achievement.progressPercent}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {(!sortedAchievements || sortedAchievements.length === 0) && (
          <div className="col-span-full py-12 text-center text-gray-500">
            {t("noAchievementsYet")}
          </div>
        )}
      </div>
    </div>
  );
}
