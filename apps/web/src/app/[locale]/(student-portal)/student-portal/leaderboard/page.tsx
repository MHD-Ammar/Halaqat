"use client";

import { Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type LeaderboardResponse,
  useCircleLeaderboard,
  useLeagueLeaderboard,
  useMosqueLeaderboard,
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
        <h1 className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text pb-2 text-3xl font-black text-transparent">
          {t("leaderboard")}
        </h1>
        <p className="font-medium text-muted-foreground">{t("leaderboardDesc")}</p>
      </div>

      <Tabs defaultValue="league" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="circle" className="rounded-lg py-3 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 md:text-base">
            <span className="mr-2 hidden md:inline">🏅</span>
            {t("myCircle")}
          </TabsTrigger>
          <TabsTrigger value="league" className="rounded-lg py-3 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 md:text-base">
            <span className="mr-2 hidden md:inline">🏆</span>
            {t("myLeague")}
          </TabsTrigger>
          <TabsTrigger value="global" className="rounded-lg py-3 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 md:text-base">
            <span className="mr-2 hidden md:inline">🌍</span>
            {t("globalRank")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="circle" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <CircleLeaderboardTab {...(currentUserId ? { currentUserId } : {})} />
        </TabsContent>

        <TabsContent value="league" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <LeagueLeaderboardTab {...(currentUserId ? { currentUserId } : {})} />
        </TabsContent>

        <TabsContent value="global" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <GlobalLeaderboardTab {...(currentUserId ? { currentUserId } : {})} />
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
    return <EmptyState message={t("noCircleAssigned")} />;
  }

  return <DefaultLeaderboardView data={data} {...(currentUserId ? { currentUserId } : {})} />;
}

function GlobalLeaderboardTab({ currentUserId }: { currentUserId?: string }) {
  const { data, isLoading } = useMosqueLeaderboard();
  const t = useTranslations("StudentPortal");

  if (isLoading) return <LoadingState />;
  if (!data || data.students.length === 0) {
    return <EmptyState message={t("noLeaderboardData")} />;
  }

  return <DefaultLeaderboardView data={data} {...(currentUserId ? { currentUserId } : {})} />;
}

function LeagueLeaderboardTab({ currentUserId }: { currentUserId?: string }) {
  const { data, isLoading } = useLeagueLeaderboard();
  const t = useTranslations("StudentPortal");

  if (isLoading) return <LoadingState />;
  if (!data || data.students.length === 0) {
    return <EmptyState message={t("noStudentsInLeague")} />;
  }

  const promotionStartIndex = data.students.findIndex((student) => student.promotionZone);
  const relegationStartIndex = data.students.findIndex((student) => student.relegationZone);
  const isCurrentUserInList = data.students.some((student) => student.id === currentUserId);

  return (
    <div className="space-y-6">
      <LeagueBadge
        leagueNameAr={data.leagueNameAr}
        leagueIcon={data.leagueIcon}
        leagueRank={data.leagueRank}
        weekEndsAt={data.weekEndsAt}
      />

      <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-muted-foreground">
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">
          {t("promotionThresholdLabel", { xp: data.promotionThreshold })}
        </span>
        <span className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-700 dark:text-rose-300">
          {t("relegationThresholdLabel", { xp: data.relegationThreshold })}
        </span>
      </div>

      <div className="space-y-3">
        {data.students.map((student, index) => (
          <Fragment key={student.id}>
            {index === promotionStartIndex && (
              <div className="my-1 text-center text-xs font-black tracking-widest text-emerald-700 dark:text-emerald-300">
                ── {t("promotionZone")} ──
              </div>
            )}
            {index === relegationStartIndex && (
              <div className="my-1 text-center text-xs font-black tracking-widest text-rose-700 dark:text-rose-300">
                ── {t("relegationZone")} ──
              </div>
            )}
            <LeaderboardRow
              student={student}
              isCurrentUser={student.id === currentUserId}
              mode="league"
            />
          </Fragment>
        ))}

        {!isCurrentUserInList && data.myRank > 0 && (
          <>
            <div className="my-4 flex justify-center">
              <span className="font-black tracking-[0.5em] text-muted-foreground">...</span>
            </div>
            <div className="flex items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center font-bold text-amber-700 dark:text-amber-400">
              {t("rankMessage", { rank: data.myRank })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DefaultLeaderboardView({ data, currentUserId }: { data: LeaderboardResponse; currentUserId?: string }) {
  const t = useTranslations("StudentPortal");
  const top3 = data.students.slice(0, 3);
  const rest = data.students.slice(3);
  const isCurrentUserInList = data.students.some((student) => student.id === currentUserId);

  return (
    <div className="animate-in fade-in duration-500">
      {top3.length > 0 && (
        <LeaderboardPodium
          topStudents={top3}
          {...(currentUserId ? { currentUserId } : {})}
        />
      )}

      <div className="mt-8 space-y-3">
        {rest.map((student) => (
          <LeaderboardRow
            key={student.id}
            student={student}
            isCurrentUser={student.id === currentUserId}
          />
        ))}

        {!isCurrentUserInList && data.myRank > 0 && (
          <>
            <div className="my-4 flex justify-center">
              <span className="font-black tracking-[0.5em] text-muted-foreground">...</span>
            </div>
            <div className="flex items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center font-bold text-amber-700 dark:text-amber-400">
              {t("rankMessage", { rank: data.myRank })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  const t = useTranslations("StudentPortal");

  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="mb-4 h-8 w-8 animate-spin" />
      <p className="animate-pulse font-medium">{t("loadingHeroes")}</p>
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
