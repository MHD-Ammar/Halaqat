"use client";

/**
 * useExams Hook
 *
 * Exam queries for the Examiner Dashboard. All hooks use apiClient for
 * consistent error normalization. No mutations exist for exams in the
 * current surface so the factory is not needed here — but all query keys
 * now come from the central registry.
 *
 * All exported names are unchanged from the original.
 */

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ExamQuestion {
  id: string;
  type: "CURRENT_PART" | "CUMULATIVE";
  questionText?: string;
  mistakesCount: number;
  maxScore: number;
  achievedScore: number;
}

export interface Exam {
  id: string;
  studentId: string;
  examinerId: string;
  date: string;
  score: number | null;
  status: "PENDING" | "COMPLETED";
  notes?: string;
  passed?: boolean | null;
  examiner?: { id: string; fullName: string };
  questions?: ExamQuestion[];
  createdAt: string;
}

export interface StudentWithLastExam {
  id: string;
  name: string;
  phone?: string;
  circle?: { id: string; name: string };
  lastExamScore?: number | null;
}

export interface ExamAttempt {
  date: string;
  score: number | null;
  passed: boolean | null;
  examId: string;
  attemptNumber: number;
  status: string;
}

export type ExamCardData = Record<number, { attempts: ExamAttempt[] }>;

// ── Queries ────────────────────────────────────────────────────────────────

export function useStudentExams(studentId: string | undefined) {
  return useQuery<Exam[]>({
    queryKey: queryKeys.exams.forStudent(studentId ?? ""),
    queryFn: () => apiClient.get<Exam[]>(`/exams/student/${studentId}`),
    enabled: !!studentId,
  });
}

export function useExam(examId: string | undefined) {
  return useQuery<Exam>({
    queryKey: queryKeys.exams.detail(examId ?? ""),
    queryFn: () => apiClient.get<Exam>(`/exams/${examId}`),
    enabled: !!examId,
  });
}

export function useSearchStudentsForExam(query: string) {
  return useQuery<StudentWithLastExam[]>({
    queryKey: queryKeys.exams.search(query),
    queryFn: () =>
      apiClient.get<StudentWithLastExam[]>(
        `/exams/search?q=${encodeURIComponent(query)}`,
      ),
    enabled: query.length > 2,
  });
}

export function useRecentExams() {
  return useQuery<Exam[]>({
    queryKey: queryKeys.exams.recent(),
    queryFn: () => apiClient.get<Exam[]>("/exams/recent"),
  });
}

export function useStudentExamCard(studentId: string | undefined) {
  return useQuery<{ juz: number; attempts: ExamAttempt[] }[]>({
    queryKey: queryKeys.exams.cardForStudent(studentId ?? ""),
    queryFn: () =>
      apiClient.get<{ juz: number; attempts: ExamAttempt[] }[]>(
        `/exams/student/${studentId}/card`,
      ),
    enabled: !!studentId,
  });
}
