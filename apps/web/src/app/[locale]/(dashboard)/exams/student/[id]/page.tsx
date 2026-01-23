"use client";

/**
 * Student Exam History Page
 *
 * Displays a student's exam history with a table of previous exams
 * and a button to start a new exam.
 */

import { use } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  FileText,
  Plus,
  ArrowLeft,
  BookOpen,
  CalendarDays,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStudentExams } from "@/hooks";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface Student {
  id: string;
  name: string;
  phone?: string;
  circle?: {
    id: string;
    name: string;
  };
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function StudentExamHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = use(params);

  const t = useTranslations("Exams");
  const tCommon = useTranslations("Common");

  // Fetch student details
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const response = await api.get<Student>(`/students/${studentId}`);
      return response.data;
    },
    enabled: !!studentId,
  });

  // Fetch student exams
  const { data: exams, isLoading: examsLoading } = useStudentExams(studentId);

  const isLoading = studentLoading || examsLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24 mt-1" />
          </div>
        </div>
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Back Link */}
      <Link
        href="/exams"
        className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 me-2" />
        {tCommon("back")}
      </Link>

      {/* Student Header */}
      {student && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                {getInitials(student.name)}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{student.name}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                  {student.circle && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{student.circle.name}</span>
                    </div>
                  )}
                  {student.phone && <span>{student.phone}</span>}
                </div>
              </div>

              {/* Start New Exam Button */}
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                {t("startNewExam")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exam History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("studentHistory")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exams && exams.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("examiner")}</TableHead>
                    <TableHead>{t("score")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("notes")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          {formatDate(exam.date)}
                        </div>
                      </TableCell>
                      <TableCell>{exam.examiner?.fullName || "-"}</TableCell>
                      <TableCell>
                        {exam.score !== null ? (
                          <Badge
                            variant={exam.score >= 80 ? "default" : "secondary"}
                            className="font-mono"
                          >
                            {exam.score}/100
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            exam.status === "COMPLETED" ? "default" : "outline"
                          }
                        >
                          {exam.status === "COMPLETED"
                            ? t("completed")
                            : t("pending")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {exam.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="text-lg mb-2">{t("noExamsYet")}</CardTitle>
              <CardDescription className="mb-4">
                {t("noExamsYetDesc")}
              </CardDescription>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                {t("startNewExam")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
