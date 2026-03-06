"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentAchievements } from "@/hooks/use-student-achievements";

export default function TrophyRoomPage() {
  const { data: achievements, isLoading } = useStudentAchievements();

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
    return 0;
  });

  return (
    <div className="space-y-8 pb-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent drop-shadow-sm">
          غرفة الجوائز
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          استعرض الأوسمة والإنجازات التي حققتها خلال رحلتك.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortedAchievements?.map((achievement, idx) => {
          const isUnlocked = achievement.isUnlocked;

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
                    ? "border-yellow-400 bg-gradient-to-b from-yellow-50 to-amber-100/50 dark:from-amber-950/40 dark:to-yellow-900/10 shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] hover:-translate-y-1" 
                    : "border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                }`}
              >
                <CardContent className="p-6 flex flex-col items-center text-center h-full">
                  {/* Badge Icon */}
                  <div className={`relative flex h-24 w-24 items-center justify-center rounded-full mb-4 transition-all duration-500 ${
                    isUnlocked 
                      ? "bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg border-4 border-yellow-200" 
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
                    isUnlocked ? "text-amber-900 dark:text-amber-100" : "text-gray-500"
                  }`}>
                    {achievement.title}
                  </h3>
                  
                  <p className={`text-sm flex-1 ${
                    isUnlocked ? "text-amber-700/80 dark:text-amber-300/80" : "text-gray-400"
                  }`}>
                    {achievement.description}
                  </p>

                  {/* Unlocked Date */}
                  {isUnlocked && achievement.unlockedAt && (
                    <div className="mt-4 pt-4 border-t border-amber-200/50 dark:border-yellow-900/50 w-full text-xs text-amber-600 dark:text-amber-400 font-medium">
                      تم الفتح: {new Date(achievement.unlockedAt).toLocaleDateString("ar-SA")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {(!sortedAchievements || sortedAchievements.length === 0) && (
          <div className="col-span-full py-12 text-center text-gray-500">
            لم يتم إضافة إنجازات بعد.
          </div>
        )}
      </div>
    </div>
  );
}
