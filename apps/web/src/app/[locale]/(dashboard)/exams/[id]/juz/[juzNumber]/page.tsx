"use client";

import { useQuery } from "@tanstack/react-query";
 import{ ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  User,
  Clock,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { use } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";


type ExamHistoryItem = {
  id: string;
  date: string;
  score: number | null;
  passed: boolean;
  notes: string | null;
  examinerName?: string; // Mock or real depending on backend
};

export default function JuzHistoryPage({
  params,
}: {
  params: Promise<{ id: string; juzNumber: string }>;
}) {
  const { id: studentId, juzNumber } = use(params);
  const t = useTranslations("Exams");
  const tCommon = useTranslations("Common");

  // Fetch exams for this student and juz
  const { data: exams, isLoading } = useQuery({
    queryKey: ["exams", "history", studentId, juzNumber],
    queryFn: async () => {
      // We might need a specific filter endpoint or filter client-side
      const res = await api.get(`/exams?studentId=${studentId}&juzNumber=${juzNumber}`);
      // Map backend entity to frontend interface
      return (res.data as any[]).map((e: any) => ({
        id: e.id,
        date: e.date,
        score: e.finalScore,
        passed: e.passed,
        notes: e.notes,
        examinerName: e.examiner?.fullName
      })) as ExamHistoryItem[];
    },
  });

  const passedCount = exams?.filter(e => e.passed).length || 0;
  const totalAttempts = exams?.length || 0;
  const bestScore = exams?.reduce((max, e) => (e.score && e.score > max ? e.score : max), 0) || 0;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/exams/${studentId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              {t("juz")} {juzNumber}
            </h1>
            <p className="text-muted-foreground">{t("examHistory")}</p>
          </div>
        </div>
        
        <Button asChild size="lg" className="shadow-md">
            <Link href={`/exams/${studentId}/session?juz=${juzNumber}`}>
                {t("startNewExam")}
            </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                      {t("totalAttempts")}
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{totalAttempts}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                      {t("timesPassed")}
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{passedCount}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                      {t("bestScore")}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">High Score</Badge>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{Math.round(bestScore)}%</div>
              </CardContent>
          </Card>
      </div>

      {/* Attempts List */}
      <Card>
          <CardHeader>
              <CardTitle>{t("attemptsHistory")}</CardTitle>
              <CardDescription>{t("historyDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
              {isLoading ? (
                  <div className="text-center py-8">{tCommon("loading")}...</div>
              ) : exams && exams.length > 0 ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>{t("date")}</TableHead>
                              <TableHead>{t("status")}</TableHead>
                              <TableHead>{t("score")}</TableHead>
                              <TableHead>{t("examiner")}</TableHead>
                              <TableHead className="text-right">{tCommon("actions")}</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {exams.map((exam) => (
                              <TableRow key={exam.id}>
                                  <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4 text-muted-foreground" />
                                          {new Date(exam.date).toLocaleDateString()}
                                      </div>
                                  </TableCell>
                                  <TableCell>
                                      {exam.passed ? (
                                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                              {t("passed")}
                                          </Badge>
                                      ) : (
                                          <Badge variant="destructive">
                                              {t("failed")}
                                          </Badge>
                                      )}
                                  </TableCell>
                                  <TableCell>
                                      <span className={`font-mono font-bold ${exam.passed ? "text-green-600" : "text-destructive"}`}>
                                           {exam.score !== null ? `${Math.round(exam.score)}%` : "-"}
                                      </span>
                                  </TableCell>
                                  <TableCell>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <User className="h-3 w-3" />
                                          {exam.examinerName || t("unknown")}
                                      </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                      <Button variant="ghost" size="sm" onClick={() => console.log("View details", exam.id)}>
                                          {t("viewDetails")}
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              ) : (
                  <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t("noAttemptsYet")}</p>
                  </div>
              )}
          </CardContent>
      </Card>
    </div>
  );
}
