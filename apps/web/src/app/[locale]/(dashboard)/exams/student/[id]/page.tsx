"use client";
import { useState, use } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  FileText,
  Plus,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
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
import { useStudentExamCard } from "@/hooks";
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

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// Generate array [1...30]
const JUZ_ARRAY = Array.from({ length: 30 }, (_, i) => i + 1);

export default function StudentExamHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = use(params);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

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

  // Fetch student exam card
  const { data: examCard, isLoading: cardLoading } = useStudentExamCard(studentId);

  const isLoading = studentLoading || cardLoading;

  // Toggle row expansion
  const toggleRow = (juz: number) => {
    if (expandedRow === juz) {
      setExpandedRow(null);
    } else {
      setExpandedRow(juz);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[500px] w-full" />
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
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary font-bold text-3xl shadow-sm">
                {getInitials(student.name)}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-muted-foreground">
                  {student.circle && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium">{student.circle.name}</span>
                    </div>
                  )}
                  {student.phone && <span>{student.phone}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full md:w-auto">
                <Button size="lg" className="w-full md:w-auto shadow-md hover:shadow-lg transition-all gap-2" asChild>
                   <Link href={`/exams/student/${studentId}/new`}>
                      <Plus className="h-5 w-5" />
                      {t("startNewExam")}
                   </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Digital Exam Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t("digitalExamCard")}
          </CardTitle>
          <CardDescription>
            {t("subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px] text-center font-bold">{t("part")}</TableHead>
                  <TableHead>{t("attempts")}</TableHead>
                  <TableHead className="w-[150px] text-center">{t("latestScore")}</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {JUZ_ARRAY.map((juz) => {
                  const data = examCard?.[juz];
                  const attempts = data?.attempts || [];
                  const latestAttempt = attempts[0]; // Sorted by date DESC in backend
                  const hasAttempts = attempts.length > 0;
                  const isExpanded = expandedRow === juz;

                  return (
                    <>
                      <TableRow 
                        key={juz} 
                        className={`cursor-pointer hover:bg-muted/30 transition-colors ${isExpanded ? "bg-muted/30" : ""}`}
                        onClick={() => hasAttempts && toggleRow(juz)}
                      >
                        <TableCell className="text-center font-bold text-lg text-muted-foreground">
                          {juz}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                             {hasAttempts ? (
                                attempts.map((attempt: any, idx: number) => (
                                  <Badge 
                                    key={idx}
                                    variant={attempt.passed ? "default" : "destructive"} // Assuming default is acceptable for passed
                                    className={`h-7 px-3 ${attempt.passed ? "bg-green-600 hover:bg-green-700" : ""}`}
                                  >
                                    {attempt.score}
                                  </Badge>
                                ))
                             ) : (
                               <span className="text-muted-foreground text-sm">-</span>
                             )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                           {latestAttempt ? (
                             <div className="flex flex-col items-center">
                               <span className={`font-bold text-lg ${latestAttempt.passed ? "text-green-600" : "text-destructive"}`}>
                                 {latestAttempt.score}
                               </span>
                               <span className="text-xs text-muted-foreground">
                                 {new Date(latestAttempt.date).toLocaleDateString()}
                               </span>
                             </div>
                           ) : (
                             <span className="text-muted-foreground">-</span>
                           )}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasAttempts && (
                            isExpanded ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />
                          )}
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Details Row */}
                      {isExpanded && hasAttempts && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10 border-t-0">
                          <TableCell colSpan={4} className="p-4">
                            <div className="bg-background rounded-md border p-4 shadow-inner">
                               <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary" />
                                  {t("history")} - {t("juz")} {juz}
                               </h4>
                               <div className="space-y-2">
                                {attempts.map((attempt: any, idx: number) => (
                                     <div key={idx} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                                        <div className="flex items-center gap-3">
                                           {attempt.passed ? (
                                             <CheckCircle2 className="h-4 w-4 text-green-600" />
                                           ) : (
                                             <XCircle className="h-4 w-4 text-destructive" />
                                           )}
                                           <span>{new Date(attempt.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="font-mono font-medium">
                                           {attempt.score} / 100
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
