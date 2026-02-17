"use client";

import { CheckCircle2, ChevronRight, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Confetti from "react-confetti";

import { DynamicFormRenderer } from "@/components/ramadan/dynamic-form-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RAMADAN_FORM } from "@/config/challenges/ramadan";
import {
  useDailyChallengeCircles,
  useDailyChallengeStudentInfo,
  useDailyChallengeStudents,
  useDailyChallengeSubmit,
} from "@/hooks/use-daily-challenge";
import { Link } from "@/i18n/routing";

export default function RamadanPage() {
  const searchParams = useSearchParams();
  const mosqueId = searchParams.get("mosqueId") || undefined;
  const CAMPAIGN_KEY = "ramadan";

  // State
  const [step, setStep] = useState<"CIRCLE" | "STUDENT" | "FORM" | "SUCCESS">(
    "CIRCLE",
  );
  const [circleId, setCircleId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Queries
  const { data: circles, isLoading: loadingCircles } =
    useDailyChallengeCircles(mosqueId);
  const { data: students, isLoading: loadingStudents } =
    useDailyChallengeStudents(circleId);
  const { data: studentInfo, isLoading: loadingInfo } =
    useDailyChallengeStudentInfo(studentId, CAMPAIGN_KEY);
  const submitMutation = useDailyChallengeSubmit();

  // Handlers
  const handleCircleSelect = (id: string) => {
    setCircleId(id);
    setStep("STUDENT");
  };

  const handleStudentSelect = (id: string) => {
    setStudentId(id);
    setStep("FORM");
  };

  const handleSubmit = (data: Record<string, any>) => {
    if (!studentId) return;

    const localDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD format (local time)

    // The submitMutation.mutate function now expects a SubmitChallengeDto
    submitMutation.mutate(
      { studentId, submissionData: data, campaignKey: CAMPAIGN_KEY, localDate },
      {
        onSuccess: (result) => {
          setSubmissionResult(result);
          setStep("SUCCESS");
        },
        onError: (err: any) => {
          // alert(err.response?.data?.message || "Something went wrong");
          console.error(err);
        },
      },
    );
  };

  const handleReset = () => {
    setStep("CIRCLE");
    setCircleId(null);
    setStudentId(null);
    setSubmissionResult(null);
  };

  // --- Renders ---

  if (step === "CIRCLE") {
    return (
      <Card className="bg-background/95 backdrop-blur shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-center text-2xl">اختر حلقتك</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingCircles ? (
            <div className="text-center p-8">جاري التحميل...</div>
          ) : (
            <div className="grid gap-3">
              {circles?.map((circle) => (
                <Button
                  key={circle.id}
                  variant="outline"
                  className="h-16 text-lg justify-between px-6 border-2 hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => handleCircleSelect(circle.id)}
                >
                  {circle.name}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Button>
              ))}
              {circles?.length === 0 && (
                <p className="text-center text-muted-foreground">
                  لا توجد حلقات متاحة لهذا المسجد.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === "STUDENT") {
    return (
      <Card className="bg-background/95 backdrop-blur shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("CIRCLE")}
              className="px-0 w-8 h-8"
            >
              <ChevronRight className="rotate-180 w-5 h-5" />
            </Button>
            اختر اسمك
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select onValueChange={handleStudentSelect}>
              <SelectTrigger className="h-14 text-lg">
                <SelectValue placeholder="بحث عن اسمك..." />
              </SelectTrigger>
              <SelectContent>
                {students?.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="h-12 text-lg">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {loadingStudents && (
              <p className="text-center text-muted-foreground">
                جاري تحميل الأسماء...
              </p>
            )}
            
            <p className="text-xs text-muted-foreground text-center mt-4">
               تأكد من اختيار اسمك الصحيح لتسجيل النقاط.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "SUCCESS") {
    return (
      <div className="fixed inset-0 bg-background/95 flex flex-col items-center justify-center p-4 z-50">
        <Confetti numberOfPieces={200} recycle={false} />
        
        <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl animate-in zoom-in-95 duration-500">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-primary font-bold">
              أحسنت يا بطل!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-lg">
                تم تسجيل إنجازك اليومي بنجاح
              </p>
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-amber-500">
                <span>+{submissionResult?.xpEarned || 0}</span>
                <span>نقطة</span>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-xl flex items-center justify-between">
               <span className="text-muted-foreground">التتابع الحالي</span>
               <div className="flex items-center gap-2 font-bold text-xl">
                 🔥 {submissionResult?.streak || 1} يوم
               </div>
            </div>

            <div className="grid gap-3 pt-4">
              <Link href={`/ramadan/leaderboard?mosqueId=${mosqueId || ""}`}>
                <Button className="w-full h-12 text-lg" variant="default">
                  <Trophy className="mr-2 w-5 h-5" />
                  شاهد الترتيب
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ALREADY SUBMITTED STATE
  if (studentInfo?.hasSubmittedToday) {
    return (
      <Card className="bg-background/95 backdrop-blur shadow-xl border-0 animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-amber-600" />
          </div>
          <CardTitle className="text-2xl text-primary font-bold">
            مرحباً {studentInfo.name.split(" ")[0]}!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground text-lg">
              لقد قمت بإرسال التحدي اليومي بالفعل.
              <br />
              عد غداً للمزيد من النقاط!
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-xl flex items-center justify-between">
            <span className="text-muted-foreground">التتابع الحالي</span>
            <div className="flex items-center gap-2 font-bold text-xl">
              🔥 {studentInfo.currentStreak} يوم
            </div>
          </div>

          <div className="grid gap-3 pt-4">
            <Link href={`/ramadan/leaderboard?mosqueId=${mosqueId || ""}`}>
              <Button className="w-full h-12 text-lg" variant="default">
                <Trophy className="mr-2 w-5 h-5" />
                شاهد الترتيب
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={handleReset}
            >
              شخص آخر؟
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // FORM STEP
  return (
    <div className="space-y-6">
      {/* User Info Header */}
      <div className="flex items-center justify-between bg-card/80 backdrop-blur p-4 rounded-xl border shadow-sm text-card-foreground">
        <div>
           <h2 className="font-bold text-lg">أهلاً {studentInfo?.name} 👋</h2>
           <p className="text-sm text-muted-foreground">لا تنسى تجديد النية!</p>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-xs text-muted-foreground">التتابع</span>
           <span className="font-bold text-amber-500 flex items-center gap-1">
             {studentInfo?.currentStreak || 0} 🔥
           </span>
        </div>
      </div>

      <DynamicFormRenderer
        questions={RAMADAN_FORM}
        onSubmit={handleSubmit}
        isSubmitting={submitMutation.isPending}
      />
    </div>
  );
}
