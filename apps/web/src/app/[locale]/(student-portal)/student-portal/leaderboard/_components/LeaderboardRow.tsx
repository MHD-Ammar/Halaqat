import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import { type LeaderboardEntry } from "@/hooks/use-student-leaderboard";
import { cn } from "@/lib/utils";

const FRAME_STYLES: Record<string, string> = {
  default: "ring-1 ring-gray-300/50",
  gold: "ring-2 ring-yellow-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]",
  emerald: "ring-2 ring-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]",
  rainbow: "ring-2 ring-transparent bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 p-[2px]",
};

interface LeaderboardRowProps {
  student: LeaderboardEntry;
  isCurrentUser: boolean;
  mode?: "default" | "league";
}

export function LeaderboardRow({ student, isCurrentUser, mode = "default" }: LeaderboardRowProps) {
  const t = useTranslations("StudentPortal");
  const isLeagueMode = mode === "league";
  const isPromotion = !!student.promotionZone;
  const isRelegation = !!student.relegationZone;

  return (
    <Card
      className={cn(
        "transition-all",
        isLeagueMode && isPromotion && "border-emerald-500/50 bg-emerald-500/10",
        isLeagueMode && isRelegation && "border-rose-500/50 bg-rose-500/10",
        !isLeagueMode && isCurrentUser && "border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-orange-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
        !isLeagueMode && !isCurrentUser && "border-white/5 bg-white/10 backdrop-blur-md hover:bg-white/20 dark:bg-card",
        isLeagueMode && isCurrentUser && "ring-1 ring-amber-400/40",
        isLeagueMode && !isPromotion && !isRelegation && "border-white/5 bg-white/10 backdrop-blur-md dark:bg-card",
      )}
    >
      <CardContent className="flex items-center p-4">
        <div className="flex w-10 justify-center text-lg font-black text-muted-foreground">
          #{student.rank}
        </div>

        <div className="ml-2 shrink-0">
          <div
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-bold text-white",
              FRAME_STYLES[student.activeAvatarFrame || "default"] || FRAME_STYLES.default,
            )}
          >
            {student.activeAvatarFrame === "rainbow" ? (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-slate-800 dark:bg-gray-800 dark:text-white">
                {student.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              student.name.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className={cn("text-base font-bold md:text-lg", isCurrentUser ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-white")}>
            {student.name}
            {isCurrentUser && (
              <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">
                ({t("yourRank")})
              </span>
            )}
          </div>
          {student.activeTitle && (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
              👑 {t(`titles.${student.activeTitle}`, { fallback: student.activeTitle })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLeagueMode ? (
            <>
              {isPromotion && <span className="text-lg font-black text-emerald-600">↑</span>}
              {isRelegation && <span className="text-lg font-black text-rose-600">↓</span>}
              <div className="text-end">
                <div className="font-mono text-lg font-black text-indigo-600 dark:text-indigo-300">
                  {student.weeklyXp ?? 0} {t("xp")}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {student.totalXp} {t("totalXp")}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="hidden items-center gap-1 rounded-md bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 md:flex">
                {t("levelBadge", { level: student.currentLevel })}
              </div>
              <div className="font-mono text-lg font-black text-indigo-600 dark:text-indigo-300">
                {student.totalXp} {t("xp")}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
