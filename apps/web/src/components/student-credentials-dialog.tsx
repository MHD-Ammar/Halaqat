"use client";

import { Copy, Check, Key, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGenerateCredentials, type Student, type StudentCredentials } from "@/hooks";
import { useToast } from "@/hooks/use-toast";

interface StudentCredentialsDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentCredentialsDialog({
  student,
  open,
  onOpenChange,
}: StudentCredentialsDialogProps) {
  const t = useTranslations("Students");
  const tCommon = useTranslations("Common");
  const { toast } = useToast();
  const generateCredentials = useGenerateCredentials();

  const [credentials, setCredentials] = useState<StudentCredentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"confirm" | "result">("confirm");

  const handleGenerate = async () => {
    if (!student) return;

    try {
      const result = await generateCredentials.mutateAsync(student.id);
      setCredentials(result);
      setStep("result");
      toast({
        title: t("credentialsGenerated"),
        description: t("credentialsDialogDesc", { name: student.name }),
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async () => {
    if (!credentials) return;
    const text = `${t("username")}: ${credentials.username}\n${t("newPassword")}: ${credentials.password}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: t("copied") });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setCredentials(null);
      setCopied(false);
      setStep("confirm");
    }
    onOpenChange(isOpen);
  };

  const isReset = !!student?.username;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            {t("credentialsDialogTitle")}
          </DialogTitle>
          {step === "confirm" && (
            <DialogDescription>
              {isReset
                ? t("resetCredentialsDesc", { name: student?.name ?? "" })
                : t("noCredentialsDesc")}
            </DialogDescription>
          )}
        </DialogHeader>

        {step === "confirm" && (
          <div className="space-y-4">
            {isReset && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {t("credentialsWarning")}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                {tCommon("cancel")}
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateCredentials.isPending}
              >
                {generateCredentials.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ltr:mr-2 rtl:ml-2" />
                    {t("generating")}
                  </>
                ) : isReset ? (
                  <>
                    <RefreshCw className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                    {t("resetCredentials")}
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                    {t("generateCredentials")}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && credentials && (
          <div className="space-y-4">
            <DialogDescription>
              {t("credentialsDialogDesc", { name: student?.name ?? "" })}
            </DialogDescription>

            {/* Credentials display */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("username")}:</span>
                <span className="font-semibold select-all">{credentials.username}</span>
              </div>
              <div className="border-t" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("newPassword")}:</span>
                <span className="font-semibold select-all tracking-wider text-primary">
                  {credentials.password}
                </span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {t("credentialsWarning")}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                {t("cancel", { ns: "Common" })}
              </Button>
              <Button onClick={handleCopy} variant={copied ? "outline" : "default"}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 ltr:mr-2 rtl:ml-2 text-green-600" />
                    {t("copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                    {t("copyCredentials")}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
