import type { FormQuestion } from "@halaqat/types";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { BooleanQuestion } from "./boolean-question";
import { NumberStepper } from "./number-stepper";
import { PrayerGrid } from "./prayer-grid";

interface DynamicFormRendererProps {
  questions: FormQuestion[];
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}

export function DynamicFormRenderer({
  questions,
  onSubmit,
  isSubmitting = false,
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initialData: Record<string, unknown> = {};
    questions.forEach((q) => {
      if (q.type === "NUMBER") {
        initialData[q.id] = q.defaultValue ?? q.min ?? 0;
      }
      if (q.type === "SELECT" && q.options?.[0]) {
        initialData[q.id] = null; // User must select
      }
    });
    return initialData;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (id: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error when field is modified
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    const newErrors: Record<string, string> = {};
    let isValid = true;

    questions.forEach((q) => {
      const val = formData[q.id];
      if (val === undefined || val === null) {
        newErrors[q.id] = "هذا السؤال مطلوب";
        isValid = false;
      }

      // Specific validation for GRID
      if (q.type === "GRID" && q.rows) {
        const gridVal = (val || {}) as Record<string, string>;
        const missingRows = q.rows.filter((row) => {
          const rowLabel = row;
          return !gridVal[rowLabel];
        });
        if (missingRows.length > 0) {
          newErrors[q.id] = `يرجى تعبئة جميع الصفوف (${missingRows.length} متبقي)`;
          isValid = false;
        }
      }

      // Validation for SELECT
      if (q.type === "SELECT" && (val === undefined || val === null || val === "")) {
        newErrors[q.id] = "هذا السؤال مطلوب";
        isValid = false;
      }
    });

    if (!isValid) {
      setErrors(newErrors);
      // Scroll to first error
      const firstErrorId = Object.keys(newErrors)[0];
      const element = document.getElementById(`question-${firstErrorId}`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      {questions.map((q, index) => (
        <Card
          key={q.id}
          id={`question-${q.id}`}
          className={`border-2 transition-all ${
            errors[q.id] ? "border-destructive bg-destructive/5" : "border-muted"
          }`}
        >
          <CardHeader>
            <CardTitle className="flex items-start justify-between">
              <span className="text-xl md:text-2xl leading-normal">
                {q.title}
              </span>
              <span className="text-muted-foreground text-sm font-normal bg-muted px-3 py-1 rounded-full">
                {index + 1} / {questions.length}
              </span>
            </CardTitle>
            {q.description && (
              <CardDescription className="text-sm text-muted-foreground mt-1">
                {q.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {q.type === "GRID" && (
              <PrayerGrid
                rows={q.rows || []}
                columns={q.columns || []}
                value={(formData[q.id] || {}) as Record<string, string>}
                onChange={(val) => handleChange(q.id, val)}
              />
            )}

            {q.type === "NUMBER" && (
              <NumberStepper
                value={(formData[q.id] as number) ?? q.defaultValue ?? q.min ?? 0}
                {...(q.max !== undefined ? { max: q.max } : {})}
                {...(q.min !== undefined ? { min: q.min } : {})}
                {...(q.step !== undefined ? { step: q.step } : {})}
                onChange={(val) => handleChange(q.id, val)}
              />
            )}

            {q.type === "BOOLEAN" && (
              <BooleanQuestion
                value={formData[q.id] as boolean | null}
                onChange={(val) => handleChange(q.id, val)}
              />
            )}

            {q.type === "SELECT" && q.options && q.options.length > 0 && (
              <Select
                value={(formData[q.id] as string) ?? ""}
                onValueChange={(val) => handleChange(q.id, val)}
              >
                <SelectTrigger className="h-14 text-lg">
                  <SelectValue placeholder="اختر..." />
                </SelectTrigger>
                <SelectContent>
                  {q.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="h-12 text-lg">
                      {opt.label} {opt.xp > 0 ? `(+${opt.xp} XP)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {errors[q.id] && (
              <p className="text-destructive font-medium mt-4 animate-in slide-in-from-top-2">
                ⚠️ {errors[q.id]}
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t z-50 md:static md:bg-transparent md:border-t-0 md:p-0">
        <Button
          type="submit"
          size="lg"
          className="w-full text-lg h-14 font-bold shadow-lg shadow-primary/20"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              إرسال التحدي اليومي
              <Send className="mr-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
