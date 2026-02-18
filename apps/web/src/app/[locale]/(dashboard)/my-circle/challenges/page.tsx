"use client";

import { addDays, format, startOfWeek, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { SubmissionDetailViewer } from "@/components/challenges/submission-detail-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RAMADAN_FORM } from "@/config/challenges/ramadan";
import { useUserProfile } from "@/hooks";
import {
  useSubmissionDetail,
  useWeeklySubmissions,
} from "@/hooks/use-weekly-submissions";

export default function ChallengesDashboardPage() {
  const t = useTranslations("ChallengesDashboard");
  const tCommon = useTranslations("Common");

  // Get user profile to find their circle
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const circleId = profile?.circles?.[0]?.id;

  // State
  // Default to start of current week (Saturday in many Islamic contexts, or Sunday?)
  // Let's assume Saturday as start of week for now, or match locale.
  // startOfWeek default is Sunday. We can adjust weekStartsOn if needed.
  // Using Saturday (weekStartsOn: 6) commonly in region.
  const [startDate, setStartDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 6 })
  );

  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);

  // Queries
  const { data: weeklyData, isLoading: isWeeklyLoading } = useWeeklySubmissions(
    circleId,
    format(startDate, "yyyy-MM-dd")
  );

  const { data: submissionDetail, isLoading: isDetailLoading } =
    useSubmissionDetail(selectedSubmissionId);

  // Handlers
  const handlePrevWeek = () => {
    setStartDate((d) => subDays(d, 7));
  };

  const handleNextWeek = () => {
    setStartDate((d) => addDays(d, 7));
  };

  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(startDate, i)
  );

  const isLoading = isProfileLoading || isWeeklyLoading;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!circleId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {tCommon("noData")} (No circle assigned)
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronRight className="h-4 w-4" /> {/* RTL flip handled by dir? Or icon flip? usually ChevronRight points 'back' in RTL if not flipped */}
            {/* In LTR ChevronLeft is back. In RTL ChevronRight is back. 
                Lucide icons don't auto-flip. 
                Let's assume standard logic: Left = previous time, Right = next time usually. 
                But in RTL UI, previous might be on the right. 
                Let's stick to arrows matching direction generally. 
                Actually, simpler: localized icons or just standard arrows. 
                For 'Previous Week' (past), usually Left arrow in LTR. 
                Let's use specific LTR/RTL class if needed or just Text. */}
          </Button>
          <div className="min-w-[150px] text-center font-medium">
            {format(startDate, "d MMM yyyy")}
          </div>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
             <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Matrix Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">{t("student")}</TableHead>
                {weekDays.map((day) => (
                  <TableHead key={day.toISOString()} className="text-center min-w-[80px]">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-normal text-muted-foreground">
                        {format(day, "EEE")}
                      </span>
                      <span className="font-bold">{format(day, "d")}</span>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center">{t("totalXp")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklyData?.map((student) => {
                const totalWeeklyXp = Object.values(student.submissions).reduce(
                  (sum, sub) => sum + sub.xp,
                  0
                );

                return (
                  <TableRow key={student.studentId}>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    {weekDays.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const sub = student.submissions[dateStr];

                      return (
                        <TableCell key={dateStr} className="p-1 text-center">
                          {sub ? (
                            <button
                              onClick={() => setSelectedSubmissionId(sub.id)}
                              className="inline-flex flex-col items-center justify-center rounded-md p-2 hover:bg-muted transition-colors w-full h-full group"
                            >
                              <Badge
                                variant="secondary"
                                className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 flex items-center gap-1"
                              >
                                <Star className="h-3 w-3 fill-current" />
                                {sub.xp}
                              </Badge>
                             {/* <span className="text-[10px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               {t("viewDetails")}
                             </span> */}
                            </button>
                          ) : (
                            <div className="flex items-center justify-center h-full min-h-[40px] text-muted-foreground/30">
                              &mdash;
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-bold text-primary">
                      {totalWeeklyXp}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!weeklyData || weeklyData.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {tCommon("noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedSubmissionId}
        onOpenChange={(open) => !open && setSelectedSubmissionId(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {submissionDetail?.studentName} 
              <span className="mx-2 font-normal text-muted-foreground">•</span> 
              {submissionDetail?.date}
            </DialogTitle>
            <DialogDescription>
              {t("totalXp")}: <span className="font-bold text-primary">{submissionDetail?.totalXp}</span>
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : submissionDetail ? (
            <SubmissionDetailViewer
              config={RAMADAN_FORM}
              data={submissionDetail.details}
            />
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {tCommon("error")}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
