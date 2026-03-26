import { Crown, Medal, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";

import { type LeaderboardEntry } from "@/hooks/use-student-leaderboard";
import { cn } from "@/lib/utils";

interface LeaderboardPodiumProps {
  topStudents: LeaderboardEntry[];
  currentUserId?: string;
}

export function LeaderboardPodium({ topStudents, currentUserId }: LeaderboardPodiumProps) {
  const t = useTranslations("StudentPortal");

  const getRankStyle = (index: number, isCurrentUser: boolean) => {
    let base = "";
    switch (index) {
      case 0: // 1st Place
        base = "border-yellow-400 bg-gradient-to-b from-yellow-300 to-yellow-600 text-yellow-950 shadow-[0_0_30px_rgba(234,179,8,0.5)]";
        break;
      case 1: // 2nd Place
        base = "border-slate-400 bg-gradient-to-b from-slate-300 to-slate-500 text-slate-900 shadow-lg";
        break;
      case 2: // 3rd Place
        base = "border-amber-800 bg-gradient-to-b from-amber-700 to-amber-900 text-amber-100 shadow-lg";
        break;
    }
    
    if (isCurrentUser) {
      base += " ring-4 ring-white ring-offset-2 ring-offset-background";
    }
    
    return base;
  };

  const renderPodiumPlace = (student: LeaderboardEntry | undefined, index: number, heightMap: Record<number, string>) => {
    if (!student) return null;
    
    const isCurrentUser = student.id === currentUserId;
    const isFirst = index === 0;

    return (
      <div 
        key={student.id} 
        className={cn(
          "flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700",
          index === 1 && "delay-100",
          index === 2 && "delay-200"
        )}
      >
        <div className={cn("mb-2 font-black", index === 0 ? "animate-bounce text-2xl" : (index === 1 ? "text-slate-300" : "text-amber-600"))}>
          {index === 0 ? "👑" : `#${index + 1}`}
        </div>
        <div className={cn("relative mx-auto", isFirst ? "z-10 w-28 scale-110 md:w-40" : "w-24 md:w-32")} style={{ height: heightMap[index] }}>
          <div
            className={cn(
              "flex h-full w-full flex-col items-center justify-center rounded-t-2xl border-t-4 p-2 text-center md:p-4",
              getRankStyle(index, isCurrentUser)
            )}
          >
            {index === 0 ? (
              <Crown className="mb-2 h-10 w-10 text-yellow-900" />
            ) : index === 1 ? (
              <Medal className="mb-2 h-8 w-8 opacity-50" />
            ) : (
              <Trophy className="mb-2 h-8 w-8 opacity-50" />
            )}
            <div className="line-clamp-2 text-sm font-extrabold md:text-lg">
              {student.name}
            </div>
            <div className="mt-1 font-mono text-xs font-bold opacity-90 md:text-sm">
              {student.totalXp} {t("xp")}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const heightMap: Record<number, string> = {
    0: "180px",
    1: "140px",
    2: "120px",
  };

  return (
    <div className="mb-12 flex items-end justify-center gap-2 px-2 pt-8 md:gap-6">
      {renderPodiumPlace(topStudents[1], 1, heightMap)}
      {renderPodiumPlace(topStudents[0], 0, heightMap)}
      {renderPodiumPlace(topStudents[2], 2, heightMap)}
    </div>
  );
}
