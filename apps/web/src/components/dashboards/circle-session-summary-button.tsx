"use client";

import { CalendarCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DailySummaryModal } from "@/components/daily-summary-modal";
import { Card, CardContent } from "@/components/ui/card";
import { useStudentsByCircle } from "@/hooks/use-students";
import { useTodaySession } from "@/hooks/use-today-session";

interface CircleSessionSummaryButtonProps {
  circleId: string;
  circleName: string;
}

export function CircleSessionSummaryButton({
  circleId,
  circleName,
}: CircleSessionSummaryButtonProps) {
  const t = useTranslations("TeacherDashboard");
  const [open, setOpen] = useState(false);

  const { data: session, isLoading: isSessionLoading } =
    useTodaySession(circleId);
  const { data: students, isLoading: isStudentsLoading } =
    useStudentsByCircle(circleId);

  // Only show if session exists and is open/closed (not null)
  // And students are loaded
  if (isSessionLoading || isStudentsLoading || !session || !students) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full text-start group"
      >
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent hover:from-indigo-500/20 hover:via-blue-500/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">{t("showSummary")}</p>
              <p className="text-xs text-muted-foreground truncate">{t("dailySummaryDesc")}</p>
            </div>
          </CardContent>
        </Card>
      </button>

      <DailySummaryModal
        open={open}
        onOpenChange={setOpen}
        circleName={circleName}
        sessionDate={session.date}
        students={students}
        attendances={session.attendances}
        recitations={session.recitations}
        pointTransactions={session.pointTransactions}
      />
    </>
  );
}
