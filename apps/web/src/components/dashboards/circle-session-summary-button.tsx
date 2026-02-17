"use client";

import { CalendarCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DailySummaryModal } from "@/components/daily-summary-modal";
import { Button } from "@/components/ui/button";
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
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <CalendarCheck className="h-4 w-4" />
        <span className="hidden sm:inline">{t("showSummary")}</span>
      </Button>

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
