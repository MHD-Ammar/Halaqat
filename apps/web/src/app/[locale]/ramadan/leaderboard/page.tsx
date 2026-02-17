"use client";

import { ChevronRight, Crown, Medal, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRamadanLeaderboard } from "@/hooks/use-ramadan";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  const mosqueId = searchParams.get("mosqueId") || undefined;

  const { data: leaderboard, isLoading } = useRamadanLeaderboard(mosqueId);

  // Top 3
  const top3 = leaderboard?.slice(0, 3) || [];
  const rest = leaderboard?.slice(3) || [];

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-b from-yellow-300 to-yellow-600 border-yellow-400 text-yellow-950 scale-110 z-10 shadow-[0_0_30px_rgba(234,179,8,0.5)]";
      case 1:
        return "bg-gradient-to-b from-slate-300 to-slate-500 border-slate-400 text-slate-900 mt-8 shadow-lg";
      case 2:
        return "bg-gradient-to-b from-amber-700 to-amber-900 border-amber-800 text-amber-100 mt-12 shadow-lg";
      default:
        return "bg-card";
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/ramadan?mosqueId=${mosqueId || ""}`}>
          <Button variant="ghost" className="text-white hover:bg-white/10">
            <ChevronRight className="rotate-180 ml-2 w-5 h-5" />
            رجوع للتحدي
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">
          لوحة الصدارة
        </h1>
        <div className="w-24" /> {/* Spacer */}
      </div>

      {isLoading ? (
        <div className="text-center p-12 text-white/50 animate-pulse">
          جاري تحميل الأبطال...
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="flex justify-center items-end gap-2 md:gap-6 mb-12 px-2">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-100">
                  <div className="mb-2 font-bold text-slate-300">#2</div>
                  <div
                    className={cn(
                      "w-24 md:w-32 p-4 rounded-t-xl flex flex-col items-center justify-end text-center border-t-4",
                      getRankStyle(1),
                    )}
                    style={{ height: "140px" }}
                  >
                    <Medal className="w-8 h-8 mb-2 opacity-50" />
                    <div className="font-bold text-sm md:text-base line-clamp-2">
                      {top3[1].name}
                    </div>
                    <div className="text-xs opacity-75 mt-1 font-mono">
                      {top3[1].totalXp} XP
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700">
                  <div className="mb-2 text-2xl animate-bounce">👑</div>
                  <div
                    className={cn(
                      "w-28 md:w-40 p-4 rounded-t-xl flex flex-col items-center justify-end text-center border-t-4 relative",
                      getRankStyle(0),
                    )}
                    style={{ height: "180px" }}
                  >
                    <Crown className="w-10 h-10 mb-2 text-yellow-900" />
                    <div className="font-extrabold text-base md:text-lg line-clamp-2">
                      {top3[0].name}
                    </div>
                    <div className="text-sm font-bold mt-1 font-mono">
                      {top3[0].totalXp} XP
                    </div>
                    
                    {/* Streak Badge */}
                    <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white/20 animate-pulse">
                      {top3[0].streak} 🔥
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-200">
                  <div className="mb-2 font-bold text-amber-600">#3</div>
                  <div
                    className={cn(
                      "w-24 md:w-32 p-4 rounded-t-xl flex flex-col items-center justify-end text-center border-t-4",
                      getRankStyle(2),
                    )}
                    style={{ height: "120px" }}
                  >
                    <Trophy className="w-8 h-8 mb-2 opacity-50" />
                    <div className="font-bold text-sm md:text-base line-clamp-2">
                      {top3[2].name}
                    </div>
                    <div className="text-xs opacity-75 mt-1 font-mono">
                      {top3[2].totalXp} XP
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List */}
          <div className="space-y-3">
            {rest.map((student, index) => (
              <Card
                key={student.studentId}
                className="bg-white/10 backdrop-blur-md border-white/5 hover:bg-white/20 transition-all"
              >
                <CardContent className="flex items-center p-4">
                  <div className="w-8 font-bold text-muted-foreground">
                    #{index + 4}
                  </div>
                  <div className="flex-1 px-4">
                     <div className="font-bold text-white">{student.name}</div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-amber-500 text-sm font-bold flex items-center gap-1">
                       {student.streak} <span className="text-xs">🔥</span>
                     </div>
                     <div className="font-mono font-bold text-indigo-300">
                       {student.totalXp} XP
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {leaderboard?.length === 0 && (
            <div className="text-center p-12 text-white/50">
              لا توجد بيانات للصدارة بعد. كن أول المنافسين!
            </div>
          )}
        </>
      )}
    </div>
  );
}
