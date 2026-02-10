"use client";

/**
 * Admin Settings Page
 *
 * Centralized settings dashboard for managing:
 * - Mosque Identity (name)
 * - Points Configuration (system scoring rules)
 * - Custom Reward Categories
 */

import { BookOpen, Check, Loader2, Save, Settings2, Star, Trash2, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { CreateCustomRuleDialog } from "@/components/create-custom-rule-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteCustomRule,
  useMosqueSettings,
  usePointRules,
  useUpdateMosque,
  useUpdatePointRules,
  type PointRule,
} from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const t = useTranslations("Settings");
  const tCommon = useTranslations("Common");
  const { toast } = useToast();

  // ==================== MOSQUE SETTINGS ====================
  const { data: mosque, isLoading: isMosqueLoading } = useMosqueSettings();
  const updateMosqueMutation = useUpdateMosque();
  const [mosqueName, setMosqueName] = useState("");
  const [manualPointLimit, setManualPointLimit] = useState(20);

  useEffect(() => {
    if (mosque) {
      setMosqueName(mosque.name);
      if (mosque.manualPointLimit !== undefined) {
        setManualPointLimit(mosque.manualPointLimit);
      }
    }
  }, [mosque]);

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
      await updateMosqueMutation.mutateAsync({
        name: mosqueName,
        manualPointLimit,
      });
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
  const deleteRuleMutation = useDeleteCustomRule();
  const [ruleValues, setRuleValues] = useState<Record<string, number>>({});

  // Separate system and custom rules
  const systemRules = rules.filter((rule) => rule.isSystem);
  const customRules = rules.filter((rule) => !rule.isSystem);

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

  const handleDeleteRule = async (ruleId: number) => {
    try {
      await deleteRuleMutation.mutateAsync(ruleId);
      toast({
        title: tCommon("success"),
        description: t("customRules.deleted"),
      });
    } catch {
      toast({
        title: tCommon("error"),
        description: t("customRules.deleteFailed"),
        variant: "destructive",
      });
    }
  };

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
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings2 className="h-6 w-6" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Section 1: Mosque Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("mosqueProfile")}
          </CardTitle>
          <CardDescription>{t("mosqueProfileDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isMosqueLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mosque-name">{t("mosqueName")}</Label>
                  <Input
                    id="mosque-name"
                    value={mosqueName}
                    onChange={(e) => setMosqueName(e.target.value)}
                    placeholder={t("mosqueNamePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-limit">
                    {t("manualPointLimit")}
                    <span className="text-xs text-muted-foreground ml-2 font-normal">
                      ({t("perWeek")})
                    </span>
                  </Label>
                  <Input
                    id="manual-limit"
                    type="number"
                    min="0"
                    value={manualPointLimit}
                    onChange={(e) => setManualPointLimit(parseInt(e.target.value) || 0)}
                  />
                </div>
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

      {/* Section 2: System Scoring Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {t("pointRules")}
          </CardTitle>
          <CardDescription>{t("pointRulesDesc")}</CardDescription>
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
                {systemRules.map((rule: PointRule) => (
                  <div
                    key={rule.key}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{iconMap[rule.key] || "📌"}</span>
                      <div>
                        <p className="font-medium">{t(`PointRules.${rule.key}`)}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(`PointRulesDesc.${rule.key}`) || rule.description}
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
                ))}
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

      {/* Section 3: Custom Reward Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                {t("customRules.title")}
              </CardTitle>
              <CardDescription>{t("customRules.desc")}</CardDescription>
            </div>
            <CreateCustomRuleDialog />
          </div>
        </CardHeader>
        <CardContent>
          {isRulesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : customRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>{t("customRules.empty")}</p>
              <p className="text-sm">{t("customRules.emptyHint")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customRules.map((rule: PointRule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎁</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{rule.description}</p>
                        {rule.isCustomEntry && (
                          <Badge variant="secondary" className="text-xs">
                            {t("customRules.variable")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {rule.isCustomEntry
                          ? t("customRules.maxValue", { max: rule.maxCustomValue ?? 0 })
                          : `+${rule.points} ${t("pointsSuffix")}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!rule.isCustomEntry && (
                      <>
                        <Input
                          type="number"
                          min="0"
                          value={ruleValues[rule.key] ?? rule.points}
                          onChange={(e) => handleRuleChange(rule.key, e.target.value)}
                          className="w-20 text-center"
                        />
                        <span className="text-sm text-muted-foreground">{t("pointsSuffix")}</span>
                      </>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("customRules.deleteTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("customRules.deleteDesc", { name: rule.description })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRule(rule.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {tCommon("delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
