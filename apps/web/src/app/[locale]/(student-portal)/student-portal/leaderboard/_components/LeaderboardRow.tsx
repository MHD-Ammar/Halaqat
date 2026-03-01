import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import { type LeaderboardEntry } from "@/hooks/use-student-leaderboard";
import { cn } from "@/lib/utils";

interface LeaderboardRowProps {
  student: LeaderboardEntry;
  isCurrentUser: boolean;
}

export function LeaderboardRow({ student, isCurrentUser }: LeaderboardRowProps) {
  const t = useTranslations("StudentPortal");

  return (
    <Card
      className={cn(
        "transition-all",
        isCurrentUser 
          ? "border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-orange-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
          : "border-white/5 bg-white/10 backdrop-blur-md hover:bg-white/20 dark:bg-card"
      )}
    >
      <CardContent className="flex items-center p-4">
        <div className="flex w-10 justify-center text-lg font-black text-muted-foreground">
          #{student.rank}
        </div>
        <div className="flex-1 px-4">
          <div className={cn("text-base font-bold md:text-lg", isCurrentUser ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-white")}>
            {student.name}
            {isCurrentUser && (
              <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">
                ({t("yourRank", { fallback: "مرتبتك" })})
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1 rounded-md bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 md:flex">
            {t("levelBadge", { level: student.currentLevel })}
          </div>
          <div className="font-mono text-lg font-black text-indigo-600 dark:text-indigo-300">
            {student.totalXp} XP
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
