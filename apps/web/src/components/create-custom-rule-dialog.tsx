"use client";

/**
 * Create Custom Rule Dialog
 *
 * Dialog for creating custom reward categories in admin settings.
 * Supports both fixed-value and variable-input rules.
 */

import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateCustomRule } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";

interface CreateCustomRuleDialogProps {
  children?: React.ReactNode;
}

export function CreateCustomRuleDialog({ children }: CreateCustomRuleDialogProps) {
  const t = useTranslations("Settings");
  const tCommon = useTranslations("Common");
  const { toast } = useToast();
  const createRule = useCreateCustomRule();

  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState<number>(5);
  const [isCustomEntry, setIsCustomEntry] = useState(false);
  const [maxCustomValue, setMaxCustomValue] = useState<number>(20);

  const resetForm = () => {
    setDescription("");
    setPoints(5);
    setIsCustomEntry(false);
    setMaxCustomValue(20);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: t("customRules.labelRequired"),
      });
      return;
    }

    try {
      await createRule.mutateAsync({
        description: description.trim(),
        points,
        isVisibleToTeacher: true,
        isCustomEntry,
        maxCustomValue: isCustomEntry ? maxCustomValue : undefined,
      });

      toast({
        title: tCommon("success"),
        description: t("customRules.created"),
      });

      resetForm();
      setIsOpen(false);
    } catch {
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: t("customRules.createFailed"),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm">
            <Plus className="h-4 w-4 me-2" />
            {t("customRules.add")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("customRules.addTitle")}</DialogTitle>
          <DialogDescription>{t("customRules.addDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="rule-label">{t("customRules.label")}</Label>
            <Input
              id="rule-label"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("customRules.labelPlaceholder")}
            />
          </div>

          {/* Default Points */}
          <div className="space-y-2">
            <Label htmlFor="rule-points">{t("customRules.defaultPoints")}</Label>
            <Input
              id="rule-points"
              type="number"
              min={0}
              max={100}
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value, 10) || 0)}
              className="w-24"
            />
          </div>

          {/* Variable Input Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="variable-input">{t("customRules.variableInput")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("customRules.variableInputDesc")}
              </p>
            </div>
            <Switch
              id="variable-input"
              checked={isCustomEntry}
              onCheckedChange={setIsCustomEntry}
            />
          </div>

          {/* Max Points (if variable) */}
          {isCustomEntry && (
            <div className="space-y-2">
              <Label htmlFor="max-points">{t("customRules.maxPoints")}</Label>
              <Input
                id="max-points"
                type="number"
                min={1}
                max={100}
                value={maxCustomValue}
                onChange={(e) => setMaxCustomValue(parseInt(e.target.value, 10) || 1)}
                className="w-24"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={createRule.isPending}>
            {createRule.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <Plus className="h-4 w-4 me-2" />
            )}
            {tCommon("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
