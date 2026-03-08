/**
 * Student Portal – Welcome Page
 *
 * Gamified welcome/home page showing hero section with XP, level, and streak stats.
 * Now includes Habit Builder features (Streak Calendar, Quest CTA, Recent Recitations).
 */

"use client";

import { Flame, Shield, Star, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { LeagueResultModal } from "@/components/league-result-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useStudentDashboard,
  useClaimLoginBonus,
  useLastWeekLeagueResult,
  useMarkLastWeekLeagueResultSeen,
  useMarkRecitationRewardSeen,
} from "@/hooks/use-student-portal";
import { useUserProfile } from "@/hooks/use-user-profile";
import { soundManager } from "@/lib/sounds";

import { CircleLiveFeed } from "./_components/CircleLiveFeed";
import { DailyBonusModal } from "./_components/DailyBonusModal";
import { DailyCountdownTimer } from "./_components/DailyCountdownTimer";
import { DailyQuestCTA } from "./_components/DailyQuestCTA";
import { RecentRecitations } from "./_components/RecentRecitations";
import { RecitationRewardModal } from "./_components/RecitationRewardModal";
import { RewardChests } from "./_components/RewardChests";
import { StreakCalendar } from "./_components/StreakCalendar";
import { StreakMultiplierBadge } from "./_components/StreakMultiplierBadge";
import { StudentAvatarCard } from "./_components/StudentAvatarCard";
import { XpProgressBar } from "./_components/XpProgressBar";

interface StudentProfile {
  id: string;
  name: string;
  role: string;
  totalXp?: number;
  currentLevel?: number;
  currentStreak?: number;
  maxStreak?: number;
}

export default function StudentPortalPage() {
  const t = useTranslations("StudentPortal");
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const student = profile as unknown as StudentProfile | undefined;

  const { data: dashboardData, isLoading: isDashboardLoading } = useStudentDashboard("ramadan");
  const { data: lastWeekLeagueResult, isLoading: isLeagueResultLoading } = useLastWeekLeagueResult();
  const claimBonus = useClaimLoginBonus();
  const markLastWeekLeagueResultSeen = useMarkLastWeekLeagueResultSeen();
  const markRecitationRewardSeen = useMarkRecitationRewardSeen();

  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [bonusXp, setBonusXp] = useState(0);
  const [leagueResultModalOpen, setLeagueResultModalOpen] = useState(false);

  const [recitationModalOpen, setRecitationModalOpen] = useState(false);
  const [recitationReward, setRecitationReward] = useState<{ id: string; xpAwarded: number; quality: string; surahName: string } | null>(null);

  useEffect(() => {
    if (lastWeekLeagueResult) {
      setLeagueResultModalOpen(true);
    }
  }, [lastWeekLeagueResult]);

  // Handle Dashboard check for unseen recitation rewards
  useEffect(() => {
    if (dashboardData?.hasUnseenRecitationReward && dashboardData.unseenRecitationReward && !recitationModalOpen) {
      setRecitationReward(dashboardData.unseenRecitationReward);
      setRecitationModalOpen(true);
    }
  }, [dashboardData, recitationModalOpen]);

  useEffect(() => {
    // Attempt to claim login bonus silently. 
    // The backend will return { claimed: false } if already claimed.
    let mounted = true;
    claimBonus.mutate(undefined, {
      onSuccess: (res) => {
        if (mounted && res.claimed && res.xpAwarded) {
          setBonusXp(res.xpAwarded);
          setBonusModalOpen(true);
        }
      }
    });

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (bonusModalOpen) {
      void soundManager.play("loginBonus");
    }
  }, [bonusModalOpen]);

  const isLoading = isProfileLoading || isDashboardLoading || isLeagueResultLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-3xl" />
          <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-4">
      {/* Social Ticker */}
      <CircleLiveFeed />

      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6 md:p-8 text-white shadow-xl shadow-orange-500/20">
        {/* Decorative circles */}
        <div className="absolute -top-8 -end-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -start-4 w-24 h-24 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar Card */}
          <div className="shrink-0">
            <StudentAvatarCard
              name={student?.name || ''}
              level={dashboardData?.currentLevel || student?.currentLevel || 1}
              activeTitle={dashboardData?.activeTitle || null}
              activeAvatarFrame={dashboardData?.activeAvatarFrame || null}
            />
          </div>

          {/* Welcome Text */}
          <div className="flex-1 text-center md:text-start">
            <h1 className="text-2xl md:text-3xl font-extrabold">
              {t("welcomeHero")}
            </h1>
            <p className="text-white/90 mt-1 md:text-lg font-medium">{t("welcomeSubtitle")}</p>
          </div>
        </div>
      </div>

      {/* Daily Countdown Timer - Compact */}
      {dashboardData && (
        <div className="flex justify-center -mt-2 mb-2 relative z-20">
          <DailyCountdownTimer 
            hasSubmittedToday={dashboardData.hasSubmittedToday} 
            variant="compact" 
          />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total XP */}
        <Card className="rounded-3xl border-amber-200/50 hover:border-amber-400 transition-colors shadow-sm dark:border-amber-500/20 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                {dashboardData?.totalXp ?? student?.totalXp ?? 0}
              </p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                {t("totalXp")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Level */}
        <Card className="rounded-3xl border-indigo-200/50 hover:border-indigo-400 transition-colors shadow-sm dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/10">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2 w-full">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="w-full flex flex-col items-center">
              <p className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                {dashboardData?.currentLevel ?? student?.currentLevel ?? 1}
              </p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">
                {t("level")}
              </p>
              {dashboardData && (
                <div className="w-16 h-1.5 bg-indigo-200 dark:bg-indigo-900/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.max(0, Math.min(dashboardData.xpProgress ?? 0, 100))}%` }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="rounded-3xl border-orange-200/50 hover:border-orange-400 transition-colors shadow-sm dark:border-orange-500/20 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/10">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-orange-600 dark:text-orange-400 tabular-nums">
                {dashboardData?.currentStreak ?? student?.currentStreak ?? 0}
              </p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                {t("streak")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Best Streak */}
        <Card className="rounded-3xl border-emerald-200/50 hover:border-emerald-400 transition-colors shadow-sm dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {student?.maxStreak ?? 0}
              </p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                {t("bestStreak")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* XP Progress Bar */}
      {isDashboardLoading ? (
        <Skeleton className="h-40 w-full rounded-3xl mb-8" />
      ) : dashboardData ? (
        <XpProgressBar
          totalXp={dashboardData.totalXp}
          currentLevel={dashboardData.currentLevel}
          currentLevelXp={dashboardData.currentLevelXp}
          nextLevelXp={dashboardData.nextLevelXp}
          xpProgress={dashboardData.xpProgress}
          xpToNextLevel={dashboardData.xpToNextLevel}
        />
      ) : null}

      {/* Habit Builder Section: Top widget is the 7-day streak calendar */}
      {dashboardData && (
        <StreakMultiplierBadge
          multiplier={dashboardData.streakMultiplier}
          multiplierLabel={dashboardData.streakMultiplierLabel}
          tier={dashboardData.streakMultiplierTier}
          currentStreak={dashboardData.currentStreak}
          nextMultiplierDaysNeeded={dashboardData.nextMultiplierDaysNeeded}
          nextMultiplierLabel={dashboardData.nextMultiplierLabel}
        />
      )}
      {dashboardData && (
        <StreakCalendar streakCalendar={dashboardData.streakCalendar} />
      )}

      {/* Daily Quest CTA - Full Width Focus */}
      {dashboardData && (
        <DailyQuestCTA hasSubmittedToday={dashboardData.hasSubmittedToday} />
      )}

      {/* Rewards Chest Section */}
      <RewardChests />

      {/* Recent Recitations */}
      {dashboardData && (
        <RecentRecitations recitations={dashboardData.recentRecitations} />
      )}
      
      {/* Modals and Overlays */}
      <DailyBonusModal 
        isOpen={bonusModalOpen} 
        onClose={() => setBonusModalOpen(false)} 
        xpAwarded={bonusXp} 
      />

      {recitationReward && (
        <RecitationRewardModal
          isOpen={recitationModalOpen}
          xpAwarded={recitationReward.xpAwarded}
          quality={recitationReward.quality}
          surahName={recitationReward.surahName}
          onClose={() => {
            setRecitationModalOpen(false);
            markRecitationRewardSeen.mutate(recitationReward.id);
          }}
        />
      )}

      <LeagueResultModal
        isOpen={leagueResultModalOpen}
        resultData={lastWeekLeagueResult ?? null}
        onClose={() => {
          setLeagueResultModalOpen(false);
          if (lastWeekLeagueResult) {
            markLastWeekLeagueResultSeen.mutate();
          }
        }}
      />
    </div>
  );
}
