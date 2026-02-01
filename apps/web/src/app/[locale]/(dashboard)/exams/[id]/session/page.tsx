"use client";

import { useState, use } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  History,
  Save,
  Minus,
  RefreshCcw,
  XCircle,
  Flag
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

// Types
type ExamStep = "SETUP" | "CURRENT_TEST" | "CUMULATIVE_TEST" | "SUMMARY";

interface ExamState {
  step: ExamStep;
  config: {
    currentJuz: number | null;
    cumulativeParts: number[];
  };
  scores: {
    currentQuestions: { mistakes: number; text: string }[]; // Array of 3 questions
    cumulativeMistakes: Record<number, number>; // Juz -> Mistakes
    cumulativeQuestionTexts: Record<number, string>; // Juz -> Question Text
  };
  notes: string;
}

const JUZ_AMMA = 30;
const WEIGHT_CURRENT = 100; // Base score for current part
const WEIGHT_CUMULATIVE = 100; // Base score for cumulative
const DEDUCTION_PER_MISTAKE = 1; // Points deducted per mistake (Frontend count = Points lost)
const GATEKEEPER_THRESHOLD = 75; // Score needed to pass current part
const PASSING_THRESHOLD = 70; // Final score needed to pass exam

export default function ExamSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = use(params);
  const router = useRouter();
  const t = useTranslations("Exams");
  const tCommon = useTranslations("Common");
  const { toast } = useToast();

  // --- STATE ---
  const [state, setState] = useState<ExamState>({
    step: "SETUP",
    config: {
      currentJuz: null,
      cumulativeParts: [],
    },
    scores: {
      currentQuestions: [
        { mistakes: 0, text: "" },
        { mistakes: 0, text: "" },
        { mistakes: 0, text: "" },
      ],
      cumulativeMistakes: {},
      cumulativeQuestionTexts: {},
    },
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- DERIVED STATE ---
  const currentMistakesTotal = state.scores.currentQuestions.reduce((sum, q) => sum + q.mistakes, 0);
  const currentPartScore = Math.max(
    0,
    WEIGHT_CURRENT - currentMistakesTotal * DEDUCTION_PER_MISTAKE
  );
  
  const isGatekeeperPassed = currentPartScore >= GATEKEEPER_THRESHOLD;

  const cumulativeAvgScore =
    state.config.cumulativeParts.length > 0
      ? state.config.cumulativeParts.reduce((acc, juz) => {
          const mistakes = state.scores.cumulativeMistakes[juz] || 0;
          return acc + Math.max(0, WEIGHT_CUMULATIVE - mistakes * DEDUCTION_PER_MISTAKE);
        }, 0) / state.config.cumulativeParts.length
      : null;

  // Weighted Final Score: 
  // If no cumulative: 100% Current
  // If cumulative: 60% Current + 40% Cumulative (Example weighting, adjustable)
  // Let's keep it simple: Average if cumulative exists, otherwise just current.
  // OR better: The "Final Score" field in DB is what matters. 
  // Let's use simple average for now: (Current + CumulativeAvg) / 2
  const finalScore = cumulativeAvgScore !== null 
    ? (currentPartScore + cumulativeAvgScore) / 2 
    : currentPartScore;

  const isExamPassed = finalScore >= PASSING_THRESHOLD && isGatekeeperPassed;

  // --- API ---
  const { data: student } = useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}`);
      return res.data;
    },
  });

  // Check attempt number (mock/real)
  const { data: attemptInfo } = useQuery({
    queryKey: ["exams", "attempt", studentId, state.config.currentJuz],
    queryFn: async () => {
        // Find existing exams for this juz
        // Actual implementation would be a specific endpoint or derived
        // For now, assume we just want to show "Attempt X"
        // We'll mock it or use search
        return { count: 0 }; // Placeholder
    },
    enabled: !!state.config.currentJuz
  });


  // --- HANDLERS ---
  const updateMistakes = (type: 'current' | 'cumulative', delta: number, indexOrJuz?: number) => {
    setState(prev => {
        if (type === 'current') {
            const idx = indexOrJuz ?? 0;
            const newQuestions = [...prev.scores.currentQuestions];
            if (newQuestions[idx]) {
                newQuestions[idx] = {
                    ...newQuestions[idx],
                    mistakes: Math.max(0, newQuestions[idx].mistakes + delta)
                };
            }
            return {
                ...prev,
                scores: {
                    ...prev.scores,
                    currentQuestions: newQuestions
                }
            };
        } else if (indexOrJuz) {
             const current = prev.scores.cumulativeMistakes[indexOrJuz] || 0;
             return {
                ...prev,
                scores: {
                    ...prev.scores,
                    cumulativeMistakes: {
                        ...prev.scores.cumulativeMistakes,
                        [indexOrJuz]: Math.max(0, current + delta)
                    }
                }
             };
        }
        return prev;
    });
  };

  const updateQuestionText = (type: 'current' | 'cumulative', text: string, indexOrJuz?: number) => {
    setState(prev => {
        if (type === 'current') {
            const idx = indexOrJuz ?? 0;
            const newQuestions = [...prev.scores.currentQuestions];
            if (newQuestions[idx]) {
                newQuestions[idx] = { ...newQuestions[idx], text };
            }
            return {
                ...prev,
                scores: { ...prev.scores, currentQuestions: newQuestions }
            };
        } else if (indexOrJuz) {
            return {
                ...prev,
                scores: {
                    ...prev.scores,
                    cumulativeQuestionTexts: {
                        ...prev.scores.cumulativeQuestionTexts,
                        [indexOrJuz]: text
                    }
                }
            };
        }
        return prev;
    });
  };

  const submitExam = async (forceFail = false) => {
     setIsSubmitting(true);
     try {
         // 1. Create Exam Record
         const payload = {
             studentId,
             date: new Date().toISOString(),
             notes: state.notes,
             juzNumber: state.config.currentJuz,
             testedParts: [state.config.currentJuz, ...state.config.cumulativeParts].filter(Boolean)
         };
         console.log("Submitting exam payload:", payload);

         const createRes = await api.post("/exams", payload);
         
         const examId = createRes.data.id;

         // 2. Submit Results
         // We construct the generic "questions" payload derived from our counters
         const questionsPayload: any[] = [];
         
         // Current Part Question
         // Current Part Question
         // Current Part Questions (Loop through the 3 questions)
         state.scores.currentQuestions.forEach((q) => {
             questionsPayload.push({
                 type: "CURRENT_PART",
                 questionJuzNumber: state.config.currentJuz,
                 mistakesCount: q.mistakes * 2, // BACKEND SCALE: 1 pt = 2 mistakes (0.5 multiplier)
                 maxScore: Math.round(WEIGHT_CURRENT / 3), // Split weight? Or just store mistakes. 
                 // Actually, maxScore per question isn't strictly defined in the aggregated view, 
                 // but for history we should probably distribute it. 
                 // Let's just say maxScore is roughly 33.33 or just keep it illustrative.
                 // Better yet, maxScore isn't critical for data integrity if calculateScore handles it.
                 // But wait, DEDUCTION_PER_MISTAKE is global.
                 // Let's set maxScore to 100 for now as it's just metadata often.
                 // Actually, let's divide it to be pedantic: 33.3 (approx)
                 questionText: q.text
             });
         });

         // Cumulative Questions
         state.config.cumulativeParts.forEach(cJuz => {
             questionsPayload.push({
                 type: "CUMULATIVE",
                 questionJuzNumber: cJuz,
                 mistakesCount: (state.scores.cumulativeMistakes[cJuz] || 0) * 2, // BACKEND SCALE
                 maxScore: WEIGHT_CUMULATIVE,
                 questionText: state.scores.cumulativeQuestionTexts[cJuz]
             });
         });

         const passed = forceFail ? false : isExamPassed;

         await api.post(`/exams/${examId}/submit`, {
             questions: questionsPayload,
             currentPartScore,
             cumulativeScore: cumulativeAvgScore ?? 0, // 0 or null?
             finalScore,
             passed, // Explicit override
             notes: state.notes
         });

         toast({
             title: passed ? t("examPassed") : t("examFailed"),
             description: t("examSubmittedDesc"),
             variant: passed ? "default" : "destructive"
         });

         router.push(`/exams/${studentId}/${state.config.currentJuz}`);

     } catch (err: any) {
         console.error("Exam submission failed:", err);
         const errorMessage = err.response?.data?.message || err.message || "Failed to submit exam";
         
         toast({
             title: tCommon("error"),
             description: Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage,
             variant: "destructive"
         });
     } finally {
         setIsSubmitting(false);
     }
  };


  // --- RENDERERS ---

  // STEP 1: SETUP
  if (state.step === "SETUP") {
      return (
          <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center gap-4 mb-8">
                  <Button variant="ghost" asChild>
                      <Link href={`/exams/${studentId}`}>
                         <ArrowLeft className="h-4 w-4 mr-2" />
                         {tCommon("back")}
                      </Link>
                  </Button>
                  <h1 className="text-3xl font-bold">{t("setupExam")}</h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Main Selection */}
                  <Card className="md:row-span-2">
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-primary" />
                              {t("selectCurrentPart")}
                          </CardTitle>
                          <CardDescription>{t("selectJuzToTest")}</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <div className="grid grid-cols-5 gap-2">
                              {Array.from({length: 30}, (_, i) => i + 1).map(juz => (
                                  <Button
                                    key={juz}
                                    variant={state.config.currentJuz === juz ? "default" : "outline"}
                                    onClick={() => setState(p => ({
                                        ...p, 
                                        config: { ...p.config, currentJuz: juz, cumulativeParts: [] }, // Reset cumulative on change
                                        scores: { 
                                            ...p.scores, 
                                            currentQuestions: [
                                                { mistakes: 0, text: "" },
                                                { mistakes: 0, text: "" },
                                                { mistakes: 0, text: "" }
                                            ],
                                            cumulativeMistakes: {} 
                                        } // Reset scores
                                    }))}
                                    className="h-12 text-lg font-medium"
                                  >
                                      {juz}
                                  </Button>
                              ))}
                          </div>
                      </CardContent>
                  </Card>

                  {/* Right: Cumulative & Info */}
                  <Card className="opacity-0 animate-in slide-in-from-bottom-4 duration-500 fill-mode-forwards" style={{ animationDelay: '100ms', opacity: state.config.currentJuz ? 1 : 0.5 }}>
                       <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                              <History className="h-5 w-5 text-orange-500" />
                              {t("cumulativeReview")}
                          </CardTitle>
                          <CardDescription>
                              {state.config.currentJuz ? t("selectPreviousParts") : t("selectCurrentFirst")}
                          </CardDescription>
                       </CardHeader>
                       <CardContent>
                            <div className="grid grid-cols-5 gap-2">
                                {Array.from({length: 30}, (_, i) => i + 1).map(juz => {
                                    const isCurrent = state.config.currentJuz === juz;
                                    const isSelected = state.config.cumulativeParts.includes(juz);

                                    // Disable current or future parts (optional logic, but usually we review BEFORE current)
                                    // For now allow any except current
                                    const isDisabled = !state.config.currentJuz || juz === state.config.currentJuz;

                                    return (
                                        <Button
                                            key={juz}
                                            size="sm"
                                            variant={isSelected ? "secondary" : "ghost"}
                                            disabled={isDisabled}
                                            onClick={() => {
                                                const parts = state.config.cumulativeParts;
                                                const newParts = parts.includes(juz) 
                                                    ? parts.filter(p => p !== juz) 
                                                    : [...parts, juz].sort((a,b) => a - b);
                                                
                                                setState(p => ({
                                                    ...p,
                                                    config: { ...p.config, cumulativeParts: newParts }
                                                }));
                                            }}
                                            className={`h-10 ${isSelected ? "border-primary border" : "border border-transparent"}`}
                                        >
                                            {juz}
                                        </Button>
                                    );
                                })}
                            </div>
                       </CardContent>
                  </Card>

                   {/* Start Button */}
                  <div className="flex justify-end items-end h-full">
                      <Button 
                        size="lg" 
                        className="w-full text-xl h-14 shadow-lg"
                        disabled={!state.config.currentJuz}
                        onClick={() => setState(p => ({ ...p, step: "CURRENT_TEST" }))}
                      >
                          {t("startExam")}
                          <ChevronRight className="ml-2 h-6 w-6" />
                      </Button>
                  </div>
              </div>
          </div>
      );
  }

  // STEP 2: CURRENT PART TESTING (THE ARENA)
  if (state.step === "CURRENT_TEST") {
      return (
          <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isGatekeeperPassed ? "bg-background" : "bg-red-50 dark:bg-red-950/20"}`}>
              {/* Top Bar */}
              <div className="p-4 border-b bg-card sticky top-0 z-10 shadow-sm">
                  <div className="max-w-3xl mx-auto flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-lg px-3 py-1">
                            {t("juz")} {state.config.currentJuz}
                        </Badge>
                        <span className="text-muted-foreground hidden md:inline-block">
                             / {t("gatekeeperPhase")}
                        </span>
                     </div>
                     <div className="text-right">
                         <div className={`text-2xl font-black font-mono tracking-tight ${isGatekeeperPassed ? "text-primary" : "text-destructive"}`}>
                             {currentPartScore}%
                         </div>
                         <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                             {t("score")}
                         </div>
                     </div>
                  </div>
              </div>

               {/* Main Arena */}
               <main className="flex-1 flex flex-col items-center justify-center p-6 gap-12 max-w-2xl mx-auto w-full">
                    
                    {/* Status Indicator */}
                    <div className="text-center space-y-2">
                        {!isGatekeeperPassed && (
                            <div className="inline-flex items-center gap-2 text-destructive font-bold bg-destructive/10 px-4 py-2 rounded-full animate-pulse">
                                <AlertTriangle className="h-5 w-5" />
                                {t("scoreTooLow")}
                            </div>
                        )}
                    </div>

                    {state.scores.currentQuestions.map((question, idx) => (
                        <Card key={idx} className="w-full shadow-lg border-2">
                            <CardHeader>
                                <CardTitle>{t("question")} {idx + 1}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">{t("optionalStartVerse")}</label>
                                        <Textarea 
                                          placeholder={t("optionalStartVerse")} 
                                          value={question.text || ""}
                                          onChange={(e) => updateQuestionText('current', e.target.value, idx)}
                                          className="text-lg resize-none"
                                          rows={2}
                                        />
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                        <div className="flex gap-3 w-full md:w-auto">
                                            <Button 
                                              variant="outline"
                                              className="h-16 flex-1 md:w-32 border-yellow-500/50 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 font-bold text-lg"
                                              onClick={() => updateMistakes('current', 1, idx)}
                                            >
                                              {t("oneMistake")}
                                            </Button>
                                            <Button 
                                              variant="outline"
                                              className="h-16 flex-1 md:w-32 border-red-500/50 text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-lg"
                                              onClick={() => updateMistakes('current', 3, idx)}
                                            >
                                              {t("threeMistakes")}
                                            </Button>
                                        </div>

                                        <div className="h-px w-full md:w-px md:h-12 bg-border" />

                                        <div className="flex items-center gap-3 bg-muted p-2 rounded-xl">
                                            <Button
                                               variant="ghost"
                                               size="icon"
                                               className="h-12 w-12 rounded-full hover:bg-background shadow-sm"
                                               onClick={() => updateMistakes('current', -1, idx)}
                                               disabled={question.mistakes === 0}
                                            >
                                                <Minus className="h-6 w-6" />
                                            </Button>
                                            
                                            <div className="flex flex-col items-center w-16">
                                                <span className="text-3xl font-black tabular-nums">{question.mistakes}</span>
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground">{t("mistakes")}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Progress Visual */}
                    <div className="w-full space-y-2">
                        <Progress value={currentPartScore} className={`h-4 ${!isGatekeeperPassed ? "bg-red-200 [&>div]:bg-red-600" : ""}`} />
                        <div className="flex justify-between text-xs font-medium text-muted-foreground">
                            <span>0%</span>
                            <span className={isGatekeeperPassed ? "text-green-600" : "text-red-500"}>
                                {t("requiredToPass")}: {GATEKEEPER_THRESHOLD}%
                            </span>
                            <span>100%</span>
                        </div>
                    </div>

               </main>

              {/* Footer Actions */}
              <div className="p-6 bg-card border-t mt-auto">
                  <div className="max-w-3xl mx-auto flex gap-4">
                      {isGatekeeperPassed ? (
                          <Button 
                             className="w-full h-14 text-xl shadow-lg gap-2" 
                             onClick={() => {
                                 // If no cumulative parts, go straight to summary
                                 if (state.config.cumulativeParts.length === 0) {
                                     setState(p => ({ ...p, step: "SUMMARY" }));
                                 } else {
                                     setState(p => ({ ...p, step: "CUMULATIVE_TEST" }));
                                 }
                             }}
                          >
                             <ShieldCheck className="h-6 w-6" />
                             {t("passAndContinue")}
                          </Button>
                      ) : (
                          <div className="w-full flex gap-3">
                              <Button variant="outline" className="flex-1 h-12" onClick={() => setState(p => ({...p, step: "SETUP"}))}>
                                  {tCommon("cancel")}
                              </Button>
                              <Button 
                                variant="destructive" 
                                className="flex-[2] h-12 gap-2"
                                onClick={() => submitExam(true)} // Force fail
                                disabled={isSubmitting}
                              >
                                  <Flag className="h-5 w-5" />
                                  {t("endExamFailed")}
                              </Button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // STEP 3: CUMULATIVE TESTING
  if (state.step === "CUMULATIVE_TEST") {
       return (
           <div className="max-w-3xl mx-auto p-6 space-y-8 animate-in slide-in-from-right-8 duration-300">
               <div className="flex items-center gap-4">
                   <Button variant="ghost" size="icon" onClick={() => setState(p => ({ ...p, step: "CURRENT_TEST"}))}>
                       <ArrowLeft className="h-5 w-5" />
                   </Button>
                   <h1 className="text-2xl font-bold">{t("cumulativeTesting")}</h1>
               </div>

               <div className="grid gap-4">
                   {state.config.cumulativeParts.map(juz => {
                       const mistakes = state.scores.cumulativeMistakes[juz] || 0;
                       const score = Math.max(0, WEIGHT_CUMULATIVE - mistakes * DEDUCTION_PER_MISTAKE);
                       
                       return (
                           <Card key={juz} className="overflow-hidden border-l-4 border-l-primary">
                               <CardContent className="p-6">
                                   <div className="flex flex-col gap-4">
                                       <div className="flex items-center justify-between">
                                           <div className="flex items-center gap-3">
                                               <Badge variant="outline" className="text-lg px-3 py-1 bg-background">
                                                   {t("juz")} {juz}
                                               </Badge>
                                           </div>
                                           <div className={`text-2xl font-black font-mono ${score < 70 ? "text-destructive" : "text-foreground"}`}>
                                               {score}%
                                           </div>
                                       </div>

                                       <Textarea 
                                         placeholder={t("optionalStartVerse")} 
                                         value={state.scores.cumulativeQuestionTexts[juz] || ""}
                                         onChange={(e) => updateQuestionText('cumulative', e.target.value, juz)}
                                         className="resize-none"
                                         rows={1}
                                       />

                                       <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2">
                                           <div className="flex gap-2 w-full md:w-auto">
                                                <Button 
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-10 flex-1 border-yellow-500/50 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 font-bold"
                                                  onClick={() => updateMistakes('cumulative', 1, juz)}
                                                >
                                                  {t("oneMistake")}
                                                </Button>
                                                <Button 
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-10 flex-1 border-red-500/50 text-red-600 hover:text-red-700 hover:bg-red-50 font-bold"
                                                  onClick={() => updateMistakes('cumulative', 3, juz)}
                                                >
                                                  {t("threeMistakes")}
                                                </Button>
                                           </div>

                                           <div className="flex items-center gap-3 bg-muted p-1.5 rounded-lg">
                                               <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 hover:bg-background shadow-sm"
                                                  onClick={() => updateMistakes('cumulative', -1, juz)}
                                                  disabled={mistakes === 0}
                                               >
                                                   <Minus className="h-4 w-4" />
                                               </Button>
                                               
                                               <span className="w-8 text-center font-mono text-xl font-bold">{mistakes}</span>
                                           </div>
                                       </div>
                                   </div>
                               </CardContent>
                           </Card>
                       );
                   })}
               </div>

               <div className="pt-8">
                   <Button 
                      className="w-full h-14 text-xl shadow-lg"
                      onClick={() => setState(p => ({ ...p, step: "SUMMARY" }))}
                   >
                       {t("finishAndGrade")}
                       <CheckCircle2 className="ml-2 h-6 w-6" />
                   </Button>
               </div>
           </div>
       );
  }

  // STEP 4: SUMMARY (RECEIPT)
  if (state.step === "SUMMARY") {
      return (
          <div className="max-w-md mx-auto p-4 md:p-8 animate-in zoom-in-95 duration-300">
               <Card className="shadow-2xl border-t-8 border-t-primary overflow-hidden">
                   <CardHeader className="bg-muted/30 pb-8 pt-8 text-center border-b">
                       <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                           {isExamPassed ? (
                               <CheckCircle2 className="h-8 w-8 text-green-600" />
                           ) : (
                               <XCircle className="h-8 w-8 text-destructive" />
                           )}
                       </div>
                       <CardTitle className="text-3xl">
                           {isExamPassed ? t("examPassed") : t("examFailed")}
                       </CardTitle>
                       <CardDescription className="text-lg">
                           {new Date().toLocaleDateString()}
                       </CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-6 pt-8">
                       {/* Line Items */}
                       <div className="space-y-4">
                           {/* Current Part */}
                           <div className="flex items-center justify-between">
                               <div>
                                   <p className="font-bold text-lg">{t("juz")} {state.config.currentJuz}</p>
                                   <p className="text-sm text-muted-foreground">{t("gatekeeper")}</p>
                               </div>
                               <div className="text-right">
                                   <p className="font-mono text-lg font-bold">{currentPartScore}%</p>
                                   <p className="text-xs text-muted-foreground">{currentMistakesTotal} {t("mistakes")}</p>
                               </div>
                           </div>

                           {/* Cumulative */}
                           {state.config.cumulativeParts.length > 0 && (
                               <div className="flex items-center justify-between border-t pt-4">
                                   <div>
                                       <p className="font-medium text-lg text-muted-foreground">{t("cumulative")}</p>
                                       <p className="text-xs text-muted-foreground">
                                           {state.config.cumulativeParts.map(p => `J${p}`).join(", ")}
                                       </p>
                                   </div>
                                   <div className="text-right">
                                       <p className="font-mono text-lg font-medium text-muted-foreground">
                                           {cumulativeAvgScore?.toFixed(1)}%
                                       </p>
                                   </div>
                               </div>
                           )}

                           {/* Final */}
                           <div className="flex items-center justify-between border-t border-double border-primary/20 pt-4 mt-4">
                               <p className="font-black text-xl">{t("totalScore")}</p>
                               <p className={`font-black text-3xl ${isExamPassed ? "text-green-600" : "text-destructive"}`}>
                                   {finalScore.toFixed(1)}%
                               </p>
                           </div>
                       </div>
                       
                       {/* Notes */}
                       <div className="pt-4">
                           <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">
                               {t("privateNotes")}
                           </label>
                           <Textarea 
                               value={state.notes}
                               onChange={(e) => setState(p => ({ ...p, notes: e.target.value }))}
                               placeholder={t("notesPlaceholder")}
                               className="bg-muted/30"
                           />
                       </div>

                   </CardContent>
                   <CardFooter className="flex flex-col gap-3 bg-muted/10 p-6">
                       <Button 
                          className="w-full h-12 text-lg font-bold shadow-md"
                          onClick={() => submitExam()}
                          disabled={isSubmitting}
                       >
                           {isSubmitting ? <RefreshCcw className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                           {t("confirmAndSubmit")}
                       </Button>
                       <Button 
                          variant="ghost" 
                          className="w-full"
                          onClick={() => setState(p => ({ ...p, step: "CURRENT_TEST" }))} // Go back to fix
                          disabled={isSubmitting}
                       >
                           {tCommon("back")}
                       </Button>
                   </CardFooter>
               </Card>
          </div>
      );
  }

  // Fallback
  return null;
}
