"use client";

import { ChevronRight, Crown, Medal, Trophy, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDailyChallengeLeaderboard } from "@/hooks/use-daily-challenge";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";


function LeaderboardContent() {
  const searchParams = useSearchParams();
  const mosqueId = searchParams.get("mosqueId") || undefined;
  const CAMPAIGN_KEY = "ramadan";

  const { data: leaderboard, isLoading } = useDailyChallengeLeaderboard(
    mosqueId,
    CAMPAIGN_KEY,
  );

  const students = leaderboard?.students || [];
  const circleAverages = leaderboard?.circleAverages || [];

  // Top 3
  const top3 = students.slice(0, 3);
  const rest = students.slice(3);

  // Max avg for normalizing progress bars
  const maxAvg = circleAverages.length > 0 ? Math.max(...circleAverages.map((c) => c.avgXp)) : 1;

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-b from-yellow-300 to-yellow-600 border-yellow-400 text-yellow-950 shadow-[0_0_30px_rgba(234,179,8,0.5)]";
      case 1:
        return "bg-gradient-to-b from-slate-300 to-slate-500 border-slate-400 text-slate-900 shadow-lg";
      case 2:
        return "bg-gradient-to-b from-amber-700 to-amber-900 border-amber-800 text-amber-100 shadow-lg";
      default:
        return "bg-card";
    }
  };

  const getCircleBarColor = (index: number) => {
    const colors = [
      "from-emerald-400 to-emerald-600",
      "from-blue-400 to-blue-600",
      "from-purple-400 to-purple-600",
      "from-amber-400 to-amber-600",
      "from-rose-400 to-rose-600",
      "from-cyan-400 to-cyan-600",
    ];
    return colors[index % colors.length];
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
          {/* Circle Battle Section */}
          {circleAverages.length > 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <h2 className="text-lg font-bold text-white/90">
                  تنافس الحلقات
                </h2>
              </div>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  {circleAverages.map((circle, index) => {
                    const pct = maxAvg > 0 ? (circle.avgXp / maxAvg) * 100 : 0;
                    const isFirst = index === 0;

                    return (
                      <div key={circle.circleId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {isFirst && (
                              <span className="text-sm">🥇</span>
                            )}
                            <span className={cn(
                              "font-semibold text-sm truncate",
                              isFirst ? "text-amber-300" : "text-white/80"
                            )}>
                              {circle.circleName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-white/40 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {circle.studentCount}
                            </span>
                            <span className={cn(
                              "font-mono font-bold text-sm",
                              isFirst ? "text-amber-400" : "text-indigo-300"
                            )}>
                              {circle.avgXp} XP
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out",
                              getCircleBarColor(index),
                              isFirst && "shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                            )}
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Podium */}
          {top3.length > 0 && (
            <div className="flex justify-center items-end gap-4 md:gap-6 mb-12 px-2">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-100">
                  <div className="mb-2 font-bold text-slate-300">#2</div>
                  <div className="relative mx-auto w-24 md:w-32" style={{ height: "140px" }}>
                    <div
                      className={cn(
                        "w-full h-full p-2 rounded-t-xl flex flex-col items-center justify-center text-center border-t-4",
                        getRankStyle(1),
                      )}
                    >
                      <Medal className="w-8 h-8 mb-2 opacity-50" />
                      <div className="font-bold text-sm md:text-base line-clamp-2">
                        {top3[1].name}
                      </div>
                      <div className="text-xs opacity-75 mt-1 font-mono">
                        {top3[1].totalXp} XP
                      </div>
                    </div>
                    {top3[1].streak > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white/20 animate-pulse z-20">
                        {top3[1].streak} 🔥
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700">
                  <div className="mb-2 text-2xl animate-bounce">👑</div>
                  <div className="relative mx-auto w-28 md:w-40 scale-110 z-10" style={{ height: "170px" }}>
                    <div
                      className={cn(
                        "w-full h-full p-4 rounded-t-xl flex flex-col items-center justify-center text-center border-t-4 relative",
                        getRankStyle(0),
                      )}
                    >
                      <Crown className="w-10 h-10 mb-2 text-yellow-900" />
                      <div className="font-extrabold text-base md:text-lg line-clamp-2">
                        {top3[0].name}
                      </div>
                      <div className="text-sm font-bold mt-1 font-mono">
                        {top3[0].totalXp} XP
                      </div>
                    </div>
                    {/* Streak Badge */}
                    {top3[0].streak > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white/20 animate-pulse z-20">
                        {top3[0].streak} 🔥
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-200">
                  <div className="mb-1 font-bold text-amber-600">#3</div>
                  <div className="relative mx-auto w-24 md:w-32" style={{ height: "130px" }}>
                    <div
                      className={cn(
                        "w-full h-full p-2 rounded-t-xl flex flex-col items-center justify-center text-center border-t-4",
                        getRankStyle(2),
                      )}
                    >
                      <Trophy className="w-8 h-8 mb-2 opacity-50" />
                      <div className="font-bold text-sm md:text-base line-clamp-2">
                        {top3[2].name}
                      </div>
                      <div className="text-xs opacity-75 mt-1 font-mono">
                        {top3[2].totalXp} XP
                      </div>
                    </div>
                    {top3[2].streak > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white/20 animate-pulse z-20">
                        {top3[2].streak} 🔥
                      </div>
                    )}
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

          {students.length === 0 && (
            <div className="text-center p-12 text-white/50">
              لا توجد بيانات للصدارة بعد. كن أول المنافسين!
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div className="text-center p-12 text-white/50">جاري التحميل...</div>}>
      <LeaderboardContent />
    </Suspense>
  );
}
