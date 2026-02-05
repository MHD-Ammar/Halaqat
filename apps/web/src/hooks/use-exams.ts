"use client";

/**
 * useExams Hook
 *
 * Fetches and manages exam data for the Examiner Dashboard.
 */

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

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
  examiner?: {
    id: string;
    fullName: string;
  };
  questions?: ExamQuestion[];
  createdAt: string;
}

export interface StudentWithLastExam {
  id: string;
  name: string;
  phone?: string;
  circle?: {
    id: string;
    name: string;
  };
  lastExamScore?: number | null;
}

/**
 * Fetch exams for a specific student
 */
export function useStudentExams(studentId: string | undefined) {
  return useQuery({
    queryKey: ["exams", "student", studentId],
    queryFn: async () => {
      const response = await api.get<Exam[]>(`/exams/student/${studentId}`);
      return response.data;
    },
    enabled: !!studentId,
  });
}

/**
 * Fetch a single exam by ID
 */
export function useExam(examId: string | undefined) {
  return useQuery({
    queryKey: ["exams", examId],
    queryFn: async () => {
      const response = await api.get<Exam>(`/exams/${examId}`);
      return response.data;
    },
    enabled: !!examId,
  });
}

/**
 * Search students for exam
 */
export function useSearchStudentsForExam(query: string) {
  return useQuery({
    queryKey: ["exams", "search", query],
    queryFn: async () => {
      const response = await api.get<StudentWithLastExam[]>(
        `/exams/search?q=${encodeURIComponent(query)}`,
      );
      return response.data;
    },
    enabled: query.length > 2,
  });
}

/**
 * Get recent exams
 */
export function useRecentExams() {
  return useQuery({
    queryKey: ["exams", "recent"],
    queryFn: async () => {
      const response = await api.get<Exam[]>("/exams/recent");
      return response.data;
    },
  });
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

/**
 * Get student exam card (grouped by Juz)
 */
export function useStudentExamCard(studentId: string | undefined) {
  return useQuery({
    queryKey: ["exams", "card", studentId],
    queryFn: async () => {
      const response = await api.get<{ juz: number; attempts: ExamAttempt[] }[]>(
        `/exams/student/${studentId}/card`,
      );
      return response.data;
    },
    enabled: !!studentId,
  });
}
