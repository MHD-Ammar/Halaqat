import { Loader2, Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormQuestion } from "@/config/ramadan-form";

import { BooleanQuestion } from "./boolean-question";
import { NumberStepper } from "./number-stepper";
import { PrayerGrid } from "./prayer-grid";

interface DynamicFormRendererProps {
  questions: FormQuestion[];
  onSubmit: (data: Record<string, any>) => void;
  isSubmitting?: boolean;
}

export function DynamicFormRenderer({
  questions,
  onSubmit,
  isSubmitting = false,
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (id: string, value: any) => {
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
        // Optional: you can define required fields in config.
        // For now, let's assume all valid inputs are required except maybe note fields (none here yet)
        // Actually, number 0 is valid. Boolean false is valid.
        // Empty object/string is invalid?
        newErrors[q.id] = "هذا السؤال مطلوب";
        isValid = false;
      }

      // Specific validation for GRID
      if (q.type === "GRID" && q.rows) {
        const gridVal = val || {};
        const missingRows = q.rows.filter((row) => !gridVal[row]);
        if (missingRows.length > 0) {
          newErrors[q.id] = `يرجى تعبئة جميع الصفوف (${missingRows.length} متبقي)`;
          isValid = false;
        }
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
          </CardHeader>
          <CardContent>
            {q.type === "GRID" && (
              <PrayerGrid
                rows={q.rows || []}
                columns={q.columns || []}
                value={formData[q.id]}
                onChange={(val) => handleChange(q.id, val)}
              />
            )}

            {q.type === "NUMBER" && (
              <NumberStepper
                value={formData[q.id] || 0}
                max={q.max}
                onChange={(val) => handleChange(q.id, val)}
              />
            )}

            {q.type === "BOOLEAN" && (
              <BooleanQuestion
                value={formData[q.id]}
                onChange={(val) => handleChange(q.id, val)}
              />
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
