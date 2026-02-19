"use client";

import { RAMADAN_FORM } from "@halaqat/types";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { Download, ChevronLeft, ChevronRight, Star, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";

import { SubmissionDetailViewer } from "@/components/challenges/submission-detail-viewer";
import {
  useAdminChallengesList,
  downloadChallengesExcel,
} from "@/hooks/use-admin-challenges";
import { useSubmissionDetail } from "@/hooks/use-weekly-submissions";

export default function AdminChallengesPage() {
  const t = useTranslations("AdminChallenges");

  // ─── Date range state (default: current week) ────────────────────────────
  const today = new Date();
  const [startDate, setStartDate] = useState(
    format(startOfWeek(today, { weekStartsOn: 6 }), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(
    format(endOfWeek(today, { weekStartsOn: 6 }), "yyyy-MM-dd"),
  );
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // ─── Submission detail modal ─────────────────────────────────────────────
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const { data: submissionDetail, isLoading: isDetailLoading } =
    useSubmissionDetail(selectedSubmissionId);

  // ─── Data fetching ───────────────────────────────────────────────────────
  const { data, isLoading } = useAdminChallengesList(
    page,
    startDate,
    endDate,
    "ramadan",
  );

  // ─── Dynamic date columns (capped at 7) ─────────────────────────────────
  const dateColumns = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.min(
      Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1,
      7,
    );
    return Array.from({ length: diffDays }, (_, i) =>
      format(addDays(start, i), "yyyy-MM-dd"),
    );
  }, [startDate, endDate]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadChallengesExcel(startDate, endDate, "ramadan");
    } finally {
      setIsExporting(false);
    }
  };

  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-card rounded-xl border">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            {t("fromDate")}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-lg border bg-background text-foreground text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            {t("toDate")}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-lg border bg-background text-foreground text-sm"
          />
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="h-10 px-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ms-auto"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {t("exportExcel")}
        </button>
      </div>

      {/* Matrix Table */}
      <div className="bg-card rounded-xl border overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !data?.data?.length ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            {t("noData")}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start py-3 px-4 font-semibold text-muted-foreground whitespace-nowrap">
                  {t("student")}
                </th>
                <th className="text-start py-3 px-4 font-semibold text-muted-foreground whitespace-nowrap">
                  {t("circle")}
                </th>
                {dateColumns.map((date) => (
                  <th
                    key={date}
                    className="text-center py-3 px-3 font-semibold text-muted-foreground whitespace-nowrap"
                  >
                    {format(new Date(date), "MM/dd")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((row: { student: { id: string; name: string; circleName: string | null }; submissions: Record<string, { id: string; xp: number; streak: number }> }) => (
                <tr
                  key={row.student.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                    {row.student.name}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
                      {row.student.circleName || "—"}
                    </span>
                  </td>
                  {dateColumns.map((date) => {
                    const sub = row.submissions[date];
                    return (
                      <td key={date} className="text-center py-3 px-3">
                        {sub ? (
                          <button
                            onClick={() => setSelectedSubmissionId(sub.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:ring-2 hover:ring-amber-400/50 transition-all cursor-pointer"
                            title={t("viewDetails")}
                          >
                            <Star className="h-3 w-3 fill-current" />
                            {sub.xp}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-muted-foreground">
            {t("page")} {meta.page} {t("of")} {meta.lastPage}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-9 px-3 inline-flex items-center gap-1 text-sm font-medium rounded-lg border bg-background hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("previous")}
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
              disabled={page >= meta.lastPage}
              className="h-9 px-3 inline-flex items-center gap-1 text-sm font-medium rounded-lg border bg-background hover:bg-muted transition-colors disabled:opacity-40"
            >
              {t("next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmissionId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedSubmissionId(null)}
        >
          <div
            className="bg-card rounded-2xl border shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {t("submissionDetails")}
              </h2>
              <button
                onClick={() => setSelectedSubmissionId(null)}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                {t("close")}
              </button>
            </div>

            {isDetailLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : submissionDetail ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{submissionDetail.studentName}</span>
                  <span>{submissionDetail.date}</span>
                </div>
                <div className="text-sm font-semibold text-amber-600">
                  ⭐ {submissionDetail.totalXp} XP
                </div>
                <SubmissionDetailViewer
                  config={RAMADAN_FORM}
                  data={submissionDetail.details}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
