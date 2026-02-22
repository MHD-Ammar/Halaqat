/**
 * Daily Quests Page
 *
 * Student portal page for viewing and submitting daily quests.
 * Features:
 * - Shows quest completion status
 * - Displays the challenge form
 * - Handles submission with gamification
 * - Triggers level-up celebration
 */

"use client";

import { getCampaignForm } from "@halaqat/types";
import { CheckCircle, Zap, Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { LevelUpModal } from "@/components/level-up-modal";
import { DynamicFormRenderer } from "@/components/ramadan/dynamic-form-renderer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodayQuests, useSubmitStudentQuests } from "@/hooks/use-student-quests";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
interface StudentProfile {
  id: string;
  name: string;
  currentLevel?: number;
  currentStreak?: number;
  totalXp?: number;
}

export default function QuestsPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { data: questsData, isLoading: isQuestsLoading } = useTodayQuests();
  const submitMutation = useSubmitStudentQuests();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({
    newLevel: 0,
    earnedXp: 0,
    newTotalXp: 0,
  });

  const student = profile as unknown as StudentProfile | undefined;
  const isLoading = isProfileLoading || isQuestsLoading;
  const hasSubmittedToday = questsData?.hasSubmittedToday ?? false;
  const campaignKey = "ramadan"; // Default for now
  const formQuestions = getCampaignForm(campaignKey);

  const handleSubmit = async (formData: Record<string, any>) => {

    setIsSubmitting(true);

    try {
      const result = await submitMutation.mutateAsync({
        submissionData: formData,
        campaignKey: "ramadan",
      });

      // Show success toast
      toast({
        title: t("Quests.submissionSuccess"),
        description: t("Quests.earnedXpDescription", { xp: result.earnedXp }),
      });

      // Show level-up modal if applicable
      if (result.levelUp) {
        setLevelUpData({
          newLevel: result.newLevel,
          earnedXp: result.earnedXp,
          newTotalXp: result.newTotalXp,
        });
        setShowLevelUp(true);
      }

      // Don't need to manually reset formData here because the entire component handles its own state
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError?.response?.data?.message || t("Common.error");
      toast({
        title: t("Common.error"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {t("Quests.dailyQuests")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t("Quests.submitTodaysQuests")}
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">{t("Gamification.xp")}</span>
              </div>
              <p className="text-2xl font-bold">{student?.totalXp ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                <span className="text-sm font-medium">{t("Gamification.level")}</span>
              </div>
              <p className="text-2xl font-bold">{student?.currentLevel ?? 1}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 mb-2">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-medium">{t("Gamification.streak")}</span>
              </div>
              <p className="text-2xl font-bold">{student?.currentStreak ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {hasSubmittedToday ? (
        // Success/Chill State
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardContent className="pt-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {t("Quests.alreadySubmitted")}
                </h2>
                <p className="text-green-700 dark:text-green-200 mt-2">
                  {t("Quests.earnedXpToday", { xp: questsData?.todayXpEarned ?? 0 })}
                </p>
              </div>
              <p className="text-sm text-green-600 dark:text-green-300">
                {t("Quests.comeBackTomorrow")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Quest Form State
        <Card>
          <CardHeader>
            <CardTitle>{t("Quests.todaysChallenge")}</CardTitle>
            <CardDescription>
              {t("Quests.completeQuestsTips")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formQuestions.length > 0 ? (
              <DynamicFormRenderer
                questions={formQuestions}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting || submitMutation.isPending}
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                {t("Quests.noQuestsAvailable")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Level Up Modal */}
      <LevelUpModal
        isOpen={showLevelUp}
        newLevel={levelUpData.newLevel}
        earnedXp={levelUpData.earnedXp}
        newTotalXp={levelUpData.newTotalXp}
        onClose={() => setShowLevelUp(false)}
      />
    </div>
  );
}
