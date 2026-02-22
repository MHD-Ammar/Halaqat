/**
 * Student Portal – Welcome Page
 *
 * Gamified welcome/home page showing hero section with XP, level, and streak stats.
 */

"use client";

import { Flame, Rocket, Shield, Star, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/hooks/use-user-profile";

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
  const { data: profile, isLoading } = useUserProfile();
  const student = profile as unknown as StudentProfile | undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6 md:p-8 text-white shadow-xl shadow-orange-500/20">
        {/* Decorative circles */}
        <div className="absolute -top-8 -end-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -start-4 w-24 h-24 rounded-full bg-white/10" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Rocket className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              {t("welcomeHero")}
            </h1>
            <p className="text-white/80 mt-1">{t("welcomeSubtitle")}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total XP */}
        <Card className="border-amber-200/50 dark:border-amber-500/20 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                {student?.totalXp ?? 0}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                {t("totalXp")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Level */}
        <Card className="border-indigo-200/50 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/10">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {student?.currentLevel ?? 1}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                {t("level")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="border-orange-200/50 dark:border-orange-500/20 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/10">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-orange-600 dark:text-orange-400 tabular-nums">
                {student?.currentStreak ?? 0}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                {t("streak")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Best Streak */}
        <Card className="border-emerald-200/50 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {student?.maxStreak ?? 0}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                {t("totalPoints")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivational Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <p className="text-lg font-semibold text-primary">{t("keepItUp")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
