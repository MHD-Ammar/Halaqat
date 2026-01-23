"use client";

/**
 * Exams Page - Student Lookup
 *
 * Search interface for examiners to find students and start exams.
 * Features: Large search bar, student cards with circle and last exam score.
 */

import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { Search, FileText, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents } from "@/hooks";

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

export default function ExamsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const t = useTranslations("Exams");
  const tCommon = useTranslations("Common");

  // Fetch all students - we'll filter client-side
  const { data, isLoading, isError } = useStudents({ limit: 100 });

  const students = data?.data || [];

  // Filter by search (name or phone)
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.guardianPhone?.toLowerCase().includes(term),
    );
  }, [students, searchTerm]);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-8">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-40 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <Skeleton className="h-14 w-full max-w-lg mx-auto" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {tCommon("error")}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Large Search Bar */}
      <div className="max-w-lg mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 text-lg text-start"
          />
        </div>
      </div>

      {/* Results */}
      {searchTerm.trim() ? (
        filteredStudents.length > 0 ? (
          <div className="max-w-2xl mx-auto space-y-3">
            {filteredStudents.map((student) => (
              <Link
                key={student.id}
                href={`/exams/student/${student.id}`}
                className="block"
              >
                <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                        {getInitials(student.name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg">{student.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {/* Circle */}
                          {student.circle && (
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              <span>{student.circle.name}</span>
                            </div>
                          )}
                          {/* Phone */}
                          {student.guardianPhone && (
                            <span>{student.guardianPhone}</span>
                          )}
                        </div>
                      </div>

                      {/* Last Exam Score */}
                      <div className="text-end">
                        <Badge
                          variant="outline"
                          className="font-mono text-base"
                        >
                          <FileText className="h-4 w-4 me-1" />
                          {t("noExams")}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          /* No Results */
          <Card className="max-w-lg mx-auto border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="text-lg mb-2">
                {t("noStudentsFound")}
              </CardTitle>
              <CardDescription className="text-center">
                {t("noStudentsFoundDesc")}
              </CardDescription>
            </CardContent>
          </Card>
        )
      ) : (
        /* Empty state - prompt to search */
        <Card className="max-w-lg mx-auto border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <CardDescription className="text-center">
              {t("subtitle")}
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
