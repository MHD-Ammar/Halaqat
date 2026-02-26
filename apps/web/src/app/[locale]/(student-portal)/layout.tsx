/**
 * Student Portal Layout
 *
 * Isolated layout for students — no sidebar, full-width with a gamified HUD.
 * Shows student avatar, name, streak, XP, and level in a sticky top bar.
 */

"use client";

import Cookies from "js-cookie";
import { Flame, LogOut, Rocket, Shield, Star, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useEffect, useState } from "react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Link, useRouter } from "@/i18n/routing";
import { TOKEN_COOKIE_NAME } from "@/lib/api";

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
  const [isChecking, setIsChecking] = useState(true);
  const t = useTranslations("StudentPortal");
  const { data: profile, isLoading } = useUserProfile();

  const studentProfile = profile as unknown as StudentProfile | undefined;

  useEffect(() => {
    const token = Cookies.get(TOKEN_COOKIE_NAME);
    if (!token) {
      router.replace("/student-login");
      return;
    }

    if (!isLoading && profile) {
      if ((profile as { role?: string }).role !== "STUDENT") {
        router.replace("/overview");
        return;
      }
      setIsChecking(false);
    }
  }, [isLoading, profile, router]);

  const handleLogout = useCallback(() => {
    Cookies.remove(TOKEN_COOKIE_NAME);
    router.push("/student-login");
    router.refresh();
  }, [router]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Gamified HUD Top Bar */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Left: Avatar + Name */}
          <div className="flex items-center gap-3 min-w-0">
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
          </div>

          {/* Center/Right: HUD Stats */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Streak */}
            <div className="flex items-center gap-1.5" title={t("streak")}>
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold tabular-nums">
                {studentProfile?.currentStreak ?? 0}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {t("streak")}
              </span>
            </div>

            {/* XP */}
            <div className="flex items-center gap-1.5" title={t("totalXp")}>
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold tabular-nums">
                {studentProfile?.totalXp ?? 0}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                XP
              </span>
            </div>

            {/* Level Badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20"
              title={t("level")}
            >
              <Shield className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {t("levelBadge", { level: studentProfile?.currentLevel ?? 1 })}
              </span>
            </div>

            {/* Trophy Room Link */}
            <Link
              href="/student-portal/achievements"
              className="flex items-center gap-1.5 p-2 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              title={t("trophyRoom") || "غرفة الجوائز"}
            >
              <Trophy className="w-5 h-5 text-yellow-500 hover:scale-110 transition-transform" />
            </Link>

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              title={t("logout")}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
