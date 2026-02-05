"use client";

/**
 * Live Exam Wizard
 * 
 * Step-by-step interface for conducting an exam.
 * Step 1: Configuration (Select main part + cumulative)
 * Step 2: Testing (Questions with mistake counters)
 * Step 3: Grading (Pass/Fail + Notes)
 */

import { ArrowLeft, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, use } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox"; // Missing
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch"; // Missing
// import { Separator } from "@/components/ui/separator"; // Missing
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks";
import { Link, useRouter } from "@/i18n/routing";
import { api } from "@/lib/api";

const JUZ_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

interface QuestionState {
  type: "CURRENT_PART" | "CUMULATIVE";
  questionText?: string;
  mistakesCount: number;
  maxScore: number;
}

export default function NewExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = use(params);
  const router = useRouter();
  const t = useTranslations("Exams");
  const tCommon = useTranslations("Common");
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exam State
  const [selectedPart, setSelectedPart] = useState<string>("");
  const [cumulativeParts, setCumulativeParts] = useState<number[]>([]);
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  
  // Grading State
  const [notes, setNotes] = useState("");
  const [isPassed, setIsPassed] = useState(true);

  // Initialize questions based on selection
  const handleStartExam = () => {
    if (!selectedPart) return;

    const newQuestions: QuestionState[] = [];

    // Add 3 questions for current part (Default rule)
    for (let i = 0; i < 3; i++) {
      newQuestions.push({
        type: "CURRENT_PART",
        mistakesCount: 0,
        maxScore: 33, // Approx, totaling ~100 with cumulative? Or logic differs.
        // Let's assume standard: 100 points total.
        // If cumulative exists, split points.
        // Simplification: Start with 100. Deductions apply. 
        // Backend calculates score: 100 - (mistakes * 0.5).
        // Frontend mostly tracks mistakes.
      });
    }

    if (cumulativeParts.length > 0) {
      // Add 1 question for cumulative
      newQuestions.push({
        type: "CUMULATIVE",
        mistakesCount: 0,
        maxScore: 0, // Score impact managed by total deduction usually, or separate
      });
    }

    setQuestions(newQuestions);
    setStep(2);
  };

  const calculateScore = () => {
    // Frontend estimation: 100 - total_mistakes (since POINTS_PER_MISTAKE = 1 now)
    const totalMistakes = questions.reduce((sum, q) => sum + q.mistakesCount, 0);
    return Math.max(0, 100 - totalMistakes);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const score = calculateScore();
      const testedParts = [parseInt(selectedPart), ...cumulativeParts]
        .filter(p => !isNaN(p) && p > 0); // Defensive filtering

      // 1. Create Exam
      const createRes = await api.post("/exams", {
        studentId,
        date: new Date().toISOString(),
        notes: "Started via Wizard",
        testedParts
      });
      const examId = createRes.data.id;

      // 2. Submit Exam
      await api.post(`/exams/${examId}/submit`, {
        questions: questions.map(q => ({
           type: q.type,
           mistakesCount: Number(q.mistakesCount),
           maxScore: 100,
           questionText: q.questionText || undefined // Ensure undefined if empty
        })),
        score: Number(score),
        notes,
        passed: isPassed,
        testedParts
      });

      toast({
        title: t("examSubmitted"),
        description: t("examSubmittedDesc"),
      });

      router.push(`/exams/student/${studentId}`);
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: t("failedToSubmit"),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/exams/student/${studentId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{t("startNewExam")}</h1>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div 
             key={s} 
             className={`h-2 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      {/* STEP 1: CONFIGURATION */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("examConfiguration")}</CardTitle>
            <CardDescription>{t("selectPartsToTest")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{t("mainPart")}</Label>
              <Select value={selectedPart} onValueChange={setSelectedPart}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectJuz")} />
                </SelectTrigger>
                <SelectContent>
                  {JUZ_OPTIONS.map((juz) => (
                    <SelectItem key={juz} value={juz.toString()}>
                      {t("juz")} {juz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="h-px bg-border w-full" />

            <div className="space-y-2">
              <Label>{t("cumulativeReview")}</Label>
              <div className="grid grid-cols-5 gap-2">
                {JUZ_OPTIONS.map((juz) => (
                  <div key={juz} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`juz-${juz}`} 
                      checked={cumulativeParts.includes(juz)}
                      onChange={(e) => {
                         const checked = e.target.checked;
                         if (checked) {
                           setCumulativeParts([...cumulativeParts, juz]);
                         } else {
                           setCumulativeParts(cumulativeParts.filter(p => p !== juz));
                         }
                      }}
                      disabled={juz.toString() === selectedPart}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label 
                      htmlFor={`juz-${juz}`} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {juz}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleStartExam} disabled={!selectedPart}>
              {tCommon("next")}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: TESTING */}
      {step === 2 && (
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <Card key={idx} className={q.type === "CUMULATIVE" ? "bg-muted/30 border-dashed" : ""}>
              <CardHeader className="pb-2">
                 <div className="flex justify-between">
                   <Badge variant={q.type === "CUMULATIVE" ? "secondary" : "default"}>
                     {q.type === "CUMULATIVE" ? t("cumulative") : `${t("question")} ${idx + 1}`}
                   </Badge>
                   <span className="font-mono text-lg font-bold text-destructive">
                     -{q.mistakesCount}
                   </span>
                 </div>
              </CardHeader>
              <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                     <Input 
                       placeholder={t("optionalStartVerse")} 
                       value={q.questionText || ""}
                       onChange={(e) => {
                         setQuestions(current => current.map((item, i) => 
                           i === idx ? { ...item, questionText: e.target.value } : item
                         ));
                       }}
                       className="flex-1 w-full md:w-auto"
                     />
                     <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <Button 
                          variant="outline"
                          className="h-12 px-4 border-yellow-500/50 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 font-bold"
                          onClick={() => {
                             setQuestions(current => current.map((item, i) => 
                               i === idx ? { ...item, mistakesCount: item.mistakesCount + 1 } : item
                             ));
                          }}
                        >
                          {t("oneMistake")}
                        </Button>
                        <Button 
                          variant="outline"
                          className="h-12 px-4 border-red-500/50 text-red-600 hover:text-red-700 hover:bg-red-50 font-bold"
                          onClick={() => {
                             setQuestions(current => current.map((item, i) => 
                               i === idx ? { ...item, mistakesCount: item.mistakesCount + 3 } : item
                             ));
                          }}
                        >
                          {t("threeMistakes")}
                        </Button>

                        <div className="mx-2 h-8 w-px bg-border hidden md:block" />

                        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                           <Button 
                             variant="ghost" 
                             size="icon"
                             className="h-8 w-8 text-muted-foreground hover:text-foreground"
                             onClick={() => {
                                setQuestions(current => current.map((item, i) => 
                                  i === idx ? { ...item, mistakesCount: Math.max(0, item.mistakesCount - 1) } : item
                                ));
                             }}
                             disabled={q.mistakesCount === 0}
                           >
                             -
                           </Button>
                           <span className="w-8 text-center font-mono font-bold">{q.mistakesCount}</span>
                        </div>
                     </div>
                  </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm sticky bottom-4">
             <div>
               <p className="text-sm text-muted-foreground">{t("currentScore")}</p>
               <p className="text-2xl font-bold">{calculateScore()}</p>
             </div>
             <div className="flex gap-2">
               <Button variant="outline" onClick={() => setStep(1)}>{tCommon("back")}</Button>
               <Button onClick={() => setStep(3)}>{t("finishGrading")}</Button>
             </div>
          </div>
        </div>
      )}

      {/* STEP 3: GRADING */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("examSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center py-8">
               <div className="text-center space-y-2">
                 <div className="text-5xl font-bold">{calculateScore()}</div>
                 <div className="text-muted-foreground">/ 100</div>
               </div>
            </div>

            {/* Separator replacement */}
            <div className="h-px bg-border w-full" />

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
               <div className="space-y-0.5">
                  <Label className="text-base">{t("finalDecision")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {isPassed ? t("studentPassed") : t("studentFailed")}
                  </p>
               </div>
               <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${!isPassed ? "text-destructive" : "text-muted-foreground"}`}>{t("fail")}</span>
                  {/* Switch replacement */}
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="pass-switch"
                      checked={isPassed}
                      onChange={(e) => setIsPassed(e.target.checked)}
                      className="peer sr-only"
                    />
                    <label 
                      htmlFor="pass-switch"
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-input transition-colors peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 peer-checked:bg-primary cursor-pointer"
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${isPassed ? "translate-x-6" : "translate-x-1"}`} />
                    </label>
                  </div>
                  <span className={`text-sm font-bold ${isPassed ? "text-green-600" : "text-muted-foreground"}`}>{t("pass")}</span>
               </div>
            </div>

            <div className="space-y-2">
              <Label>{t("privateNotes")}</Label>
              <Textarea 
                placeholder={t("notesPlaceholder")} 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>{tCommon("back")}</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                 <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                 <Save className="h-4 w-4" />
              )}
              {t("submitExam")}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
