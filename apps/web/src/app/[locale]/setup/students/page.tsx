"use client";

/**
 * Setup Students Page (Step 2)
 *
 * Second step of the setup wizard:
 * - Quick add students manually
 * - Bulk import from paste (Excel/WhatsApp)
 */

import { Loader2, Plus, Trash2, Upload, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/api";

interface ManualStudent {
  name: string;
  phone: string;
}

export default function SetupStudentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("Setup");
  const tCommon = useTranslations("Common");

  const [circleId, setCircleId] = useState<string | null>(null);
  const [circleName, setCircleName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual add state
  const [manualStudents, setManualStudents] = useState<ManualStudent[]>([
    { name: "", phone: "" },
  ]);

  // Bulk import state
  const [bulkText, setBulkText] = useState("");
  const [parsedNames, setParsedNames] = useState<string[]>([]);

  // Get circle info from session storage
  useEffect(() => {
    const storedCircleId = sessionStorage.getItem("setup_circleId");
    const storedCircleName = sessionStorage.getItem("setup_circleName");

    if (!storedCircleId) {
      // No circle created, go back to welcome
      router.replace("/setup/welcome");
      return;
    }

    setCircleId(storedCircleId);
    setCircleName(storedCircleName || "");
  }, [router]);

  // Parse bulk text when it changes
  useEffect(() => {
    const names = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    setParsedNames(names);
  }, [bulkText]);

  // Add another manual student row
  const addManualRow = () => {
    setManualStudents([...manualStudents, { name: "", phone: "" }]);
  };

  // Remove a manual student row
  const removeManualRow = (index: number) => {
    if (manualStudents.length > 1) {
      setManualStudents(manualStudents.filter((_, i) => i !== index));
    }
  };

  // Update manual student field
  const updateManualStudent = (
    index: number,
    field: keyof ManualStudent,
    value: string
  ) => {
    const updated = [...manualStudents];
    if (updated[index]) {
      updated[index][field] = value;
    }
    setManualStudents(updated);
  };

  // Submit students
  const handleSubmit = async (mode: "manual" | "bulk") => {
    if (!circleId) return;

    setIsSubmitting(true);

    try {
      let studentCount = 0;

      if (mode === "manual") {
        // Filter out empty entries
        const validStudents = manualStudents.filter(
          (s) => s.name.trim().length > 0
        );

        if (validStudents.length === 0) {
          toast({
            variant: "destructive",
            title: tCommon("error"),
            description: t("studentName") + " مطلوب",
          });
          setIsSubmitting(false);
          return;
        }

        // Use bulk API with names only (phone ignored for simplicity in setup)
        const names = validStudents.map((s) => s.name.trim());
        const response = await api.post<{ count: number }>("/students/bulk", {
          circleId,
          names,
        });
        studentCount = response.data.count;
      } else {
        // Bulk mode
        if (parsedNames.length === 0) {
          toast({
            variant: "destructive",
            title: tCommon("error"),
            description: t("bulkImportPlaceholder"),
          });
          setIsSubmitting(false);
          return;
        }

        const response = await api.post<{ count: number }>("/students/bulk", {
          circleId,
          names: parsedNames,
        });
        studentCount = response.data.count;
      }

      // Store count for finish page
      sessionStorage.setItem("setup_studentCount", String(studentCount));

      toast({
        title: tCommon("success"),
        description: t("successMessage", { count: studentCount }),
      });

      router.push("/setup/finish");
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast({
        variant: "destructive",
        title: tCommon("error"),
        description: axiosError.response?.data?.message || tCommon("error"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Skip student addition
  const handleSkip = () => {
    sessionStorage.setItem("setup_studentCount", "0");
    router.push("/setup/finish");
  };

  if (!circleId) {
    return (
      <Card className="shadow-xl">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <Users className="h-6 w-6" />
          {t("addStudentsTitle")}
        </CardTitle>
        <CardDescription>
          {circleName && `الحلقة: ${circleName}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="bulk" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bulk" className="gap-2">
              <Upload className="h-4 w-4" />
              {t("bulkImport")}
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Plus className="h-4 w-4" />
              {t("quickAdd")}
            </TabsTrigger>
          </TabsList>

          {/* Bulk Import Tab */}
          <TabsContent value="bulk" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Textarea
                placeholder={t("bulkImportPlaceholder")}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {t("bulkImportHint")}
              </p>
            </div>

            {/* Preview parsed names */}
            {parsedNames.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("parsedNames")} ({parsedNames.length})
                </label>
                <div className="max-h-32 overflow-y-auto bg-muted/50 rounded-lg p-3 space-y-1">
                  {parsedNames.map((name, i) => (
                    <div
                      key={i}
                      className="text-sm py-1 px-2 bg-background rounded"
                    >
                      {i + 1}. {name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => handleSubmit("bulk")}
              className="w-full"
              size="lg"
              disabled={isSubmitting || parsedNames.length === 0}
            >
              {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("continue")} ({parsedNames.length})
            </Button>
          </TabsContent>

          {/* Manual Add Tab */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {manualStudents.map((student, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder={t("studentName")}
                      value={student.name}
                      onChange={(e) =>
                        updateManualStudent(index, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      placeholder={t("studentPhone")}
                      value={student.phone}
                      onChange={(e) =>
                        updateManualStudent(index, "phone", e.target.value)
                      }
                    />
                  </div>
                  {manualStudents.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeManualRow(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={addManualRow}
              className="w-full"
              type="button"
            >
              <Plus className="me-2 h-4 w-4" />
              {t("addAnother")}
            </Button>

            <Button
              onClick={() => handleSubmit("manual")}
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("continue")}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Skip button */}
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="w-full"
          disabled={isSubmitting}
        >
          {t("skip")}
        </Button>
      </CardContent>
    </Card>
  );
}
