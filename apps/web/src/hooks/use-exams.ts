"use client";

/**
 * useExams Hook
 *
 * Fetches and manages exam data for the Examiner Dashboard.
 */

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

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
