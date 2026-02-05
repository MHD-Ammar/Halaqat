"use client";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { use } from "react";



import { ExamMasteryGrid } from "@/components/exams/exam-mastery-grid";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentExamCard } from "@/hooks";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";


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

  // Fetch student exam card
  const { data: examCard, isLoading: cardLoading } = useStudentExamCard(studentId);

  const isLoading = studentLoading || cardLoading;

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
                   <Link href={`/exams/${studentId}/session`}>
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
          <ExamMasteryGrid data={examCard} studentId={studentId} />
        </CardContent>
      </Card>
    </div>
  );
}
