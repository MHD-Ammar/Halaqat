"use client";

import { addDays, format, startOfWeek, subDays } from "date-fns";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { SubmissionDetailViewer } from "@/components/challenges/submission-detail-viewer";
import { DataTable } from "@/components/shared/data-table";
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
import { RAMADAN_FORM } from "@/config/challenges/ramadan";
import { useUserProfile } from "@/hooks";
import {
  useSubmissionDetail,
  useWeeklySubmissions,
} from "@/hooks/use-weekly-submissions";
import { Link } from "@/i18n/routing";
import { routes } from "@/lib/constants/routes";

export default function ChallengesDashboardPage() {
  const t = useTranslations("ChallengesDashboard");
  const tCommon = useTranslations("Common");

  // Get user profile to find their circle
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const circleId = profile?.circles?.[0]?.id;

  // State
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
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4">
        {/* Back + Title row */}
        <div className="flex items-center gap-3">
          <Link href={routes.overview()}>
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-lg">
              <ArrowRight className="h-5 w-5 rtl:rotate-0 ltr:rotate-180" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground truncate">{t("subtitle")}</p>
          </div>
        </div>

        {/* Week navigation — always centered */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handlePrevWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="min-w-[140px] text-center font-medium text-sm sm:text-base">
            {format(startDate, "d MMM yyyy")}
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleNextWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <DataTable
              data={weeklyData || []}
              isLoading={isWeeklyLoading}
              emptyState={{
                title: tCommon("noData"),
              }}
              columns={[
                {
                  header: t("student"),
                  accessorKey: "name",
                  className: "w-[200px] font-medium",
                },
                ...weekDays.map((day) => ({
                  header: (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-normal text-muted-foreground">
                        {format(day, "EEE")}
                      </span>
                      <span className="font-bold">{format(day, "d")}</span>
                    </div>
                  ),
                  className: "text-center min-w-[80px] p-1",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  cell: (student: any) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const sub = student.submissions[dateStr];
                    if (!sub) {
                      return (
                        <div className="flex items-center justify-center h-full min-h-[40px] text-muted-foreground/30">
                          &mdash;
                        </div>
                      );
                    }
                    return (
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
                      </button>
                    );
                  },
                })),
                {
                  header: t("totalXp"),
                  className: "text-center font-bold text-primary",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  cell: (student: any) =>
                    Object.values(student.submissions).reduce(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (sum: number, sub: any) => sum + sub.xp,
                      0
                    ),
                },
              ]}
            />
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {weeklyData?.map((student) => {
          const totalWeeklyXp = Object.values(student.submissions).reduce(
            (sum, sub) => sum + sub.xp,
            0
          );

          return (
            <Card key={student.studentId} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Student header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                  <span className="font-semibold text-sm">{student.name}</span>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 font-bold">
                    <Star className="h-3 w-3 fill-current me-1" />
                    {totalWeeklyXp}
                  </Badge>
                </div>
                {/* Day chips grid */}
                <div className="grid grid-cols-7 gap-0">
                  {weekDays.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const sub = student.submissions[dateStr];

                    return (
                      <button
                        key={dateStr}
                        onClick={() => sub && setSelectedSubmissionId(sub.id)}
                        disabled={!sub}
                        className="flex flex-col items-center py-3 px-1 transition-colors hover:bg-muted/50 disabled:opacity-40 disabled:cursor-default border-e last:border-e-0"
                      >
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {format(day, "EEE")}
                        </span>
                        <span className="text-[10px] text-muted-foreground mb-1">
                          {format(day, "d")}
                        </span>
                        {sub ? (
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-bold">
                            {sub.xp}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full text-muted-foreground/30 text-xs">
                            —
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!weeklyData || weeklyData.length === 0) && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {tCommon("noData")}
            </CardContent>
          </Card>
        )}
      </div>

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
