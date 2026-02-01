"use client";

/**
 * Exams Page - Student Lookup
 *
 * Search interface for examiners to find students and start exams.
 * Features: Large search bar, student cards with circle and last exam score.
 */

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { Search, BookOpen, CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSearchStudentsForExam, useRecentExams } from "@/hooks";
import { useEffect } from "react";

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
  const debouncedSearch = useDebounce(searchTerm, 500); // We'll need useDebounce

  const t = useTranslations("Exams");
  const tCommon = useTranslations("Common");

  // Backend Search
  const { data: searchResults, isLoading: isSearchLoading } = useSearchStudentsForExam(debouncedSearch);
  
  // Recent Exams
  const { data: recentExams, isLoading: isRecentLoading } = useRecentExams();

  const students = searchResults || [];

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
            className="pl-12 h-14 text-lg text-start shadow-sm"
            autoFocus
          />
          {isSearchLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {debouncedSearch.length > 2 ? (
        <div className="max-w-2xl mx-auto space-y-3">
          {students.length > 0 ? (
            students.map((student) => (
              <Link
                key={student.id}
                href={`/exams/${student.id}`}
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
                          {student.circle && (
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              <span>{student.circle.name}</span>
                            </div>
                          )}
                          {student.phone && <span>{student.phone}</span>}
                        </div>
                      </div>

                      <div className="text-end">
                        <Button variant="ghost" size="sm">
                          {t("viewProfile")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
             !isSearchLoading && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">{t("noStudentsFound")}</p>
                </CardContent>
              </Card>
             )
          )}
        </div>
      ) : (
        /* Recent Activity Section */
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {t("recentExams")}
          </h2>
          
          {isRecentLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
             </div>
          ) : recentExams && recentExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentExams.map((exam) => (
                <Link key={exam.id} href={`/exams/${exam.studentId}`}>
                  <Card className="hover:shadow-sm transition-all h-full bg-muted/20">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-medium truncate">
                            {exam.studentId /* We need student name here, assuming relation populated */}
                        </CardTitle>
                        <Badge variant={exam.passed ? "default" : "destructive"} className={`text-xs ${exam.passed ? "bg-green-600 hover:bg-green-700" : ""}`}>
                           {exam.score}/100
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                         {new Date(exam.date).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 text-sm text-muted-foreground">
                      {/* We'll show tested parts if available, otherwise just notes or ID */}
                       Exam for Student {exam.studentId.slice(0, 8)}...
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12 bg-muted/20 rounded-lg border border-dashed">
              {t("noRecentActivity")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simple debounce hook implementation inline if no generic one exists, 
// or I can import useDebounce from a lib if available. 
// Assuming I need to add useDebounce to imports or create it.
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}
