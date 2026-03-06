"use client";

import { Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  type LeaderboardResponse, 
  type LeagueLeaderboardResponse,
  useCircleLeaderboard, 
  useLeagueLeaderboard, 
  useMosqueLeaderboard 
} from "@/hooks/use-student-leaderboard";
import { useStudentPortal } from "@/hooks/use-student-portal";

import { LeaderboardPodium } from "./_components/LeaderboardPodium";
import { LeaderboardRow } from "./_components/LeaderboardRow";
import { LeagueBadge } from "./_components/LeagueBadge";

export default function StudentLeaderboardPage() {
  const t = useTranslations("StudentPortal");
  const { data: portalData } = useStudentPortal();
  const currentUserId = portalData?.student?.id;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-4">
      <div>
        <h1 className="pb-2 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
          {t("leaderboard", { fallback: "لوحة الصدارة" })}
        </h1>
        <p className="font-medium text-muted-foreground">
          {t("leaderboardDesc", { fallback: "تنافس مع أصدقائك واصعد إلى القمة!" })}
        </p>
      </div>

      <Tabs defaultValue="league" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="circle" className="rounded-lg py-3 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 md:text-base">
            <span className="hidden mr-2 md:inline">🏫</span> 
            {t("myCircle", { fallback: "حلقتي" })}
          </TabsTrigger>
          <TabsTrigger value="league" className="rounded-lg py-3 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 md:text-base">
            <span className="hidden mr-2 md:inline">🏆</span> 
            {t("myLeague", { fallback: "دوري الأبطال" })}
          </TabsTrigger>
          <TabsTrigger value="global" className="rounded-lg py-3 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 md:text-base">
            <span className="hidden mr-2 md:inline">🌍</span> 
            {t("globalRank", { fallback: "الترتيب العام" })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="circle" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <CircleLeaderboardTab currentUserId={currentUserId} />
        </TabsContent>

        <TabsContent value="league" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <LeagueLeaderboardTab currentUserId={currentUserId} />
        </TabsContent>

        <TabsContent value="global" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <GlobalLeaderboardTab currentUserId={currentUserId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CircleLeaderboardTab({ currentUserId }: { currentUserId?: string }) {
  const { data, isLoading } = useCircleLeaderboard();
  const t = useTranslations("StudentPortal");

  if (isLoading) return <LoadingState />;

  if (!data || data.students.length === 0) {
    return <EmptyState message={t("noCircleAssigned", { fallback: "لم يتم تعيينك لحلقة بعد أو لا يوجد طلاب في حلقتك." })} />;
  }

  return <LeaderboardView data={data} currentUserId={currentUserId} />;
}

function LeagueLeaderboardTab({ currentUserId }: { currentUserId?: string }) {
  const { data, isLoading } = useLeagueLeaderboard();
  const t = useTranslations("StudentPortal");

  if (isLoading) return <LoadingState />;

  if (!data || data.students.length === 0) {
    return <EmptyState message={t("noStudentsInLeague", { fallback: "لا يوجد طلاب في هذا الدوري بعد." })} />;
  }

  return (
    <div className="space-y-8">
      <LeagueBadge leagueNameAr={data.leagueNameAr} />
      <LeaderboardView data={data} currentUserId={currentUserId} />
    </div>
  );
}

function GlobalLeaderboardTab({ currentUserId }: { currentUserId?: string }) {
  const { data, isLoading } = useMosqueLeaderboard();
  const t = useTranslations("StudentPortal");
  
  if (isLoading) return <LoadingState />;
  
  if (!data || data.students.length === 0) {
    return <EmptyState message={t("noLeaderboardData", { fallback: "لا توجد بيانات للصدارة في المسجد بعد." })} />;
  }

  return <LeaderboardView data={data} currentUserId={currentUserId} />;
}

function LeaderboardView({ data, currentUserId }: { data: LeaderboardResponse | LeagueLeaderboardResponse, currentUserId?: string }) {
  const top3 = data.students.slice(0, 3);
  const rest = data.students.slice(3);
  const myRank = data.myRank;
  
  const isCurrentUserInList = data.students.some((s) => s.id === currentUserId);

  return (
    <div className="animate-in fade-in duration-500">
      {top3.length > 0 && <LeaderboardPodium topStudents={top3} currentUserId={currentUserId} />}
      
      <div className="mt-8 space-y-3">
        {rest.map((student) => (
          <LeaderboardRow 
            key={student.id} 
            student={student} 
            isCurrentUser={student.id === currentUserId} 
          />
        ))}

        {!isCurrentUserInList && myRank > 0 && (
          <>
            <div className="my-4 flex justify-center">
              <span className="text-muted-foreground font-black tracking-[0.5em]">...</span>
            </div>
            <div className="flex items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center font-bold text-amber-700 dark:text-amber-400">
              أنت في المرتبة #{myRank} — استمر بالمحاولة للوصول إلى القمة! 💪
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="mb-4 h-8 w-8 animate-spin" />
      <p className="animate-pulse font-medium">جاري تحميل الأبطال...</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-20 text-center">
      <Info className="mb-4 h-12 w-12 text-muted-foreground/50" />
      <p className="text-lg font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
