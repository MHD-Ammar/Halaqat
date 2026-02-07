"use client";

/**
 * Admin Settings Page
 *
 * Centralized settings dashboard for managing:
 * - Mosque Identity (name)
 * - Points Configuration (scoring rules)
 */

import { BookOpen, Check, Loader2, Save, Settings2, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMosqueSettings,
  usePointRules,
  useUpdateMosque,
  useUpdatePointRules,
  type PointRule,
} from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";

/**
 * Map rule keys to readable labels and icons
 */


export default function AdminSettingsPage() {
const t = useTranslations("Settings");
  const { toast } = useToast();

  // ==================== MOSQUE SETTINGS ====================
  const { data: mosque, isLoading: isMosqueLoading } = useMosqueSettings();
  const updateMosqueMutation = useUpdateMosque();
  const [mosqueName, setMosqueName] = useState("");

  useEffect(() => {
    if (mosque?.name) {
      setMosqueName(mosque.name);
    }
  }, [mosque?.name]);

  const handleSaveMosque = async () => {
    if (!mosqueName.trim()) {
      toast({
        title: t("messages.error"),
        description: t("messages.mosqueNameRequired"),
        variant: "destructive",
      });
      return;
    }

    try {
      await updateMosqueMutation.mutateAsync({ name: mosqueName });
      toast({
        title: t("messages.success"),
        description: t("messages.mosqueUpdated"),
      });
    } catch {
      toast({
        title: t("messages.error"),
        description: t("messages.mosqueUpdateFailed"),
        variant: "destructive",
      });
    }
  };

  // ==================== POINT RULES ====================
  const { data: rules = [], isLoading: isRulesLoading } = usePointRules();
  const updateRulesMutation = useUpdatePointRules();
  const [ruleValues, setRuleValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (rules.length > 0) {
      const values: Record<string, number> = {};
      rules.forEach((rule: PointRule) => {
        values[rule.key] = rule.points;
      });
      setRuleValues(values);
    }
  }, [rules]);

  const handleRuleChange = (key: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setRuleValues((prev) => ({ ...prev, [key]: numValue }));
    }
  };

  const handleSaveRules = async () => {
    try {
      const rulesArray = Object.entries(ruleValues).map(([key, points]) => ({
        key,
        points,
      }));

      await updateRulesMutation.mutateAsync({ rules: rulesArray });
      toast({
        title: t("messages.success"),
        description: t("messages.rulesUpdated"),
      });
    } catch {
      toast({
        title: t("messages.error"),
        description: t("messages.rulesUpdateFailed"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings2 className="h-6 w-6" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {/* Section 1: Mosque Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("mosqueProfile")}
          </CardTitle>
          <CardDescription>
            {t("mosqueProfileDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isMosqueLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="mosque-name">{t("mosqueName")}</Label>
                <Input
                  id="mosque-name"
                  value={mosqueName}
                  onChange={(e) => setMosqueName(e.target.value)}
                  placeholder={t("mosqueNamePlaceholder")}
                  className="max-w-md"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{t("inviteCode")}:</span>
                <code className="bg-muted px-2 py-1 rounded font-mono">
                  {mosque?.code || "---"}
                </code>
              </div>

              <Button
                onClick={handleSaveMosque}
                disabled={updateMosqueMutation.isPending}
                className="mt-4"
              >
                {updateMosqueMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <Save className="h-4 w-4 me-2" />
                )}
                {t("saveChanges")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Scoring Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {t("pointRules")}
          </CardTitle>
          <CardDescription>
            {t("pointRulesDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRulesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {rules.map((rule: PointRule) => {
                  const iconMap: Record<string, string> = {
                    RECITATION_PAGE: "📖",
                    RECITATION_EXCELLENT: "🌟",
                    RECITATION_VERY_GOOD: "⭐",
                    RECITATION_GOOD: "✨",
                    RECITATION_ACCEPTABLE: "📝",
                    RECITATION_POOR: "📋",
                    ATTENDANCE_PRESENT: "✅",
                    ATTENDANCE_ON_TIME: "⏰",
                    EXAM_EXCELLENT: "🏆",
                    EXAM_GOOD: "🎯",
                  };

                  return (
                    <div
                      key={rule.key}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{iconMap[rule.key] || "📌"}</span>
                        <div>
                          <p className="font-medium">
                            {t(`PointRules.${rule.key}`)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rule.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={ruleValues[rule.key] ?? rule.points}
                          onChange={(e) => handleRuleChange(rule.key, e.target.value)}
                          className="w-20 text-center"
                        />
                        <span className="text-sm text-muted-foreground">{t("pointsSuffix")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={handleSaveRules}
                disabled={updateRulesMutation.isPending}
                className="mt-6"
              >
                {updateRulesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <Check className="h-4 w-4 me-2" />
                )}
                {t("save")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
