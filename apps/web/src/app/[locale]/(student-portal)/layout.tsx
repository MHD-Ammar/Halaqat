/**
 * Student Portal Layout
 *
 * Isolated layout for students — no sidebar, full-width with a gamified HUD.
 * Shows student avatar, name, streak, XP, and level in a sticky top bar.
 */

"use client";

import { UserRole } from "@halaqat/types";
import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { Flame, LogOut, Rocket, Shield, Star, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useEffect, useState } from "react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentDashboard } from "@/hooks/use-student-portal";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Link, useRouter } from "@/i18n/routing";
import { TOKEN_COOKIE_NAME } from "@/lib/api";
import { routes } from "@/lib/constants/routes";

import { StudentBottomNav } from "./_components/StudentBottomNav";
import { RewardChests } from "./student-portal/_components/RewardChests";
import { SoundToggle } from "./student-portal/_components/SoundToggle";
import { StreakCalendar } from "./student-portal/_components/StreakCalendar";

interface StudentProfile {
  id: string;
  name: string;
  role: string;
  username?: string;
  totalXp?: number;
  currentLevel?: number;
  currentStreak?: number;
  maxStreak?: number;
}

export default function StudentPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(true);
  const t = useTranslations("StudentPortal");
  
  const { data: profile, isLoading } = useUserProfile();
  const studentProfile = profile as unknown as StudentProfile | undefined;

  // Add Dashboard data for the Streak Calendar dialog
  const { data: dashboardData } = useStudentDashboard("ramadan");

  // Interaction States
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [streakDialogOpen, setStreakDialogOpen] = useState(false);
  const [rewardsDialogOpen, setRewardsDialogOpen] = useState(false);

  useEffect(() => {
    const token = Cookies.get(TOKEN_COOKIE_NAME);
    if (!token) {
      router.replace(routes.studentLogin());
      return;
    }

    if (!isLoading && profile) {
      if ((profile as { role?: string }).role !== UserRole.STUDENT) {
        router.replace(routes.overview());
        return;
      }
      setIsChecking(false);
    }
  }, [isLoading, profile, router]);

  const handleLogout = useCallback(() => {
    Cookies.remove(TOKEN_COOKIE_NAME);
    queryClient.clear();
    router.push(routes.studentLogin());
    router.refresh();
  }, [queryClient, router]);

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="flex justify-center mx-auto">
            <Logo width={48} height={48} />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  const currentStreak = dashboardData?.currentStreak ?? studentProfile?.currentStreak ?? 0;
  const currentXp = dashboardData?.totalXp ?? studentProfile?.totalXp ?? 0;
  const currentLevel = dashboardData?.currentLevel ?? studentProfile?.currentLevel ?? 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Gamified HUD Top Bar */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Left: Avatar + Name (Clickable) */}
          <button 
            type="button"
            onClick={() => setProfileSheetOpen(true)}
            className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity"
          >
            <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">
                {studentProfile?.name || "Student"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{studentProfile?.username || "..."}
              </p>
            </div>
          </button>

          {/* Center/Right: HUD Stats */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Streak */}
            <button 
              type="button"
              onClick={() => setStreakDialogOpen(true)}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity" 
              title={t("streak")}
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold tabular-nums">
                {currentStreak}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {t("streak")}
              </span>
            </button>

            {/* XP */}
            <button 
              type="button"
              onClick={() => setRewardsDialogOpen(true)}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity" 
              title={t("totalXp")}
            >
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold tabular-nums">
                {currentXp}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                XP
              </span>
            </button>

            {/* Level Badge */}
            <button
              type="button"
              onClick={() => setRewardsDialogOpen(true)}
              className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 hover:opacity-80 transition-opacity"
              title={t("level")}
            >
              <Shield className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {t("levelBadge", { level: currentLevel })}
              </span>
            </button>

            <SoundToggle />

            {/* Trophy Room Link (Hidden on mobile, uses bottom nav) */}
            <Link
              href={routes.studentPortalAchievements()}
              className="hidden md:flex items-center gap-1.5 p-2 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              title={t("trophyRoom") || "غرفة الجوائز"}
            >
              <Trophy className="w-5 h-5 text-yellow-500 hover:scale-110 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content with bottom padding for mobile navigation */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Navigation (Hidden on md and up) */}
      <StudentBottomNav />

      {/* --- Interactive Overlays --- */}

      {/* Profile Sheet */}
      <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <SheetHeader className="mb-6">
            <SheetTitle>ملفي الشخصي</SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg">{studentProfile?.name}</p>
                <p className="text-sm text-muted-foreground">@{studentProfile?.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-card border p-4 flex flex-col items-center justify-center gap-2">
                <Star className="w-6 h-6 text-amber-500" />
                <span className="font-bold text-lg">{currentXp}</span>
                <span className="text-xs text-muted-foreground">نقاط الخبرة</span>
              </div>
              <div className="rounded-xl bg-card border p-4 flex flex-col items-center justify-center gap-2">
                <Shield className="w-6 h-6 text-indigo-500" />
                <span className="font-bold text-lg">{currentLevel}</span>
                <span className="text-xs text-muted-foreground">المستوى</span>
              </div>
            </div>

            <Button
              variant="destructive"
              className="w-full mt-4 flex items-center gap-2"
              onClick={() => {
                setProfileSheetOpen(false);
                handleLogout();
              }}
            >
              <LogOut className="w-4 h-4" />
              {t("logout")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Streak Calendar Dialog */}
      <Dialog open={streakDialogOpen} onOpenChange={setStreakDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              سلسلة الحضور
            </DialogTitle>
            <DialogDescription>
              حافظ على حضورك اليومي لزيادة سلسلتك وكسب المزيد من الجوائز!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {dashboardData?.streakCalendar ? (
              <StreakCalendar streakCalendar={dashboardData.streakCalendar} />
            ) : (
              <div className="flex justify-center p-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rewards Dialog */}
      <Dialog open={rewardsDialogOpen} onOpenChange={setRewardsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              صناديق الجوائز
            </DialogTitle>
            <DialogDescription>
              اجمع نقاط الخبرة (XP) لفتح هذه الصناديق والحصول على جوائز رائعة.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RewardChests />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
