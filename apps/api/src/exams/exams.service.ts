/**
 * Exams Service
 *
 * Business logic for managing exams in the Quran Testing System.
 * Handles exam creation, submission, and scoring.
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ExamQuestionType, ExamStatus } from "@halaqat/types";

import { Exam } from "./entities/exam.entity";
import { ExamQuestion } from "./entities/exam-question.entity";
import { CreateExamDto } from "./dto/create-exam.dto";
import { SubmitExamDto, ExamQuestionDto } from "./dto/submit-exam.dto";
import { StudentsService } from "../students/students.service";

/** Points deducted per mistake for scoring calculation */
const POINTS_PER_MISTAKE = 0.5;

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    @InjectRepository(ExamQuestion)
    private examQuestionRepository: Repository<ExamQuestion>,
    private studentsService: StudentsService,
  ) {}

  /**
   * Create a new exam session
   *
   * @param examinerId - ID of the examiner creating the exam
   * @param dto - CreateExamDto with student ID and optional date/notes
   * @param mosqueId - Optional mosque ID for tenancy
   * @returns The created exam
   */
  async createExam(
    examinerId: string,
    dto: CreateExamDto,
    mosqueId?: string | null,
  ): Promise<Exam> {
    console.log("Creating exam:", { examinerId, dto, mosqueId });
    const exam = new Exam();
    exam.studentId = dto.studentId;
    exam.examinerId = examinerId;
    exam.date = dto.date ? new Date(dto.date) : new Date();
    exam.notes = dto.notes ?? null;
    exam.status = ExamStatus.PENDING;
    if (dto.testedParts) {
      exam.testedParts = dto.testedParts;
    }
    
    // Fetch student to get mosqueId if not provided
    if (!mosqueId) {
       const student = await this.studentsService.findOne(dto.studentId);
       if (!student) throw new NotFoundException("Student not found");
       // Assuming student has mosqueId
       // We need to ensure we have a valid mosqueId
       // If student.mosqueId is missing (unlikely but possible), this will fail database constraint
       exam.mosqueId = student.mosqueId;
       console.log("Using student mosqueId:", student.mosqueId);
    } else {
       exam.mosqueId = mosqueId;
    }

    return this.examRepository.save(exam);
  }

  /**
   * Submit an exam with questions and calculate the final score
   *
   * Scoring Logic:
   * - If score is provided in DTO, use it as override
   * - Otherwise, calculate: 100 - (0.5 * total mistakes for CURRENT_PART questions)
   *
   * @param examId - ID of the exam to submit
   * @param dto - SubmitExamDto with questions and optional score override
   * @returns The updated exam with questions
   */
  async submitExam(examId: string, dto: SubmitExamDto): Promise<Exam> {
    const exam = await this.findOne(examId);

    if (exam.status === ExamStatus.COMPLETED) {
      throw new NotFoundException("Exam has already been completed");
    }

    // Calculate achieved scores for each question
    const questionEntities = dto.questions.map((q) =>
      this.calculateQuestionScore(examId, q),
    );

    // Save all questions
    await this.examQuestionRepository.save(questionEntities);

    // Calculate final score
    let finalScore: number;
    if (dto.score !== undefined) {
      // Use examiner's override score
      finalScore = dto.score;
    } else {
      // Auto-calculate based on CURRENT_PART questions
      const currentPartQuestions = dto.questions.filter(
        (q) => q.type === ExamQuestionType.CURRENT_PART,
      );
      const totalMistakes = currentPartQuestions.reduce(
        (sum, q) => sum + q.mistakesCount,
        0,
      );
      finalScore = Math.max(0, 100 - totalMistakes * POINTS_PER_MISTAKE);
    }

    exam.status = ExamStatus.COMPLETED;
    exam.score = finalScore;
    if (dto.notes) {
      exam.notes = dto.notes;
    }
    if (dto.testedParts) {
      exam.testedParts = dto.testedParts;
    }
    if (dto.passed !== undefined) {
      exam.passed = dto.passed;
    } else {
      // Auto-calculate pass if not provided (e.g., score >= 50)
      exam.passed = finalScore >= 50;
    }

    return this.examRepository.save(exam);
  }

  /**
   * Find an exam by ID with all relations
   *
   * @param id - Exam ID
   * @returns The exam with student, examiner, and questions
   */
  async findOne(id: string): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id },
      relations: ["student", "examiner", "questions"],
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    return exam;
  }

  /**
   * Find all exams for a student
   *
   * @param studentId - Student ID
   * @returns Array of exams ordered by date (newest first)
   */
  async findByStudent(studentId: string): Promise<Exam[]> {
    return this.examRepository.find({
      where: { studentId },
      relations: ["examiner", "questions"],
      order: { date: "DESC" },
    });
  }

  /**
   * Search students for exam (scoped by mosque)
   */
  async searchStudents(term: string, mosqueId?: string) {
    // Reuse StudentsService's findAll with search and Mosque scope
    // We only need a few results for the spotlight search
    if (!term) return [];
    
    // Check if term is UUID -> get specific student
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);
    
    if (isUuid) {
      try {
        const student = await this.studentsService.findOne(term);
        // Verify mosque tenancy if mosqueId provided
        if (mosqueId && student.mosqueId !== mosqueId) {
          return [];
        }
        return [student];
      } catch {
        return [];
      }
    }

    const result = await this.studentsService.findAll(
      { search: term, limit: 10, page: 1 }, 
      mosqueId
    );
    return result.data;
  }

  /**
   * Get student's exam card (history grouped by Part/Juz)
   */
  async getStudentExamCard(studentId: string) {
    const exams = await this.findByStudent(studentId);
    
    // Initialize structure for 30 Juz
    const card: Record<number, { attempts: { date: Date; score: number | null; passed: boolean | null; examId: string }[] }> = {};
    for (let i = 1; i <= 30; i++) {
      card[i] = { attempts: [] };
    }

    // Populate with exam data
    for (const exam of exams) {
      if (!exam.testedParts || exam.testedParts.length === 0) continue;
      
      for (const part of exam.testedParts) {
        const partData = card[part];
        if (partData) {
          partData.attempts.push({
            date: exam.date,
            score: exam.score,
            passed: exam.passed, // No default needed here, nullable in entity
            examId: exam.id,
          });
        }
      }
    }

    // Sort attempts by date DESC for each part
    for (let i = 1; i <= 30; i++) {
      card[i]?.attempts.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    return card;
  }

  /**
   * Get recent exams conducted by the mosque (or globally if no mosqueId)
   */
  async getRecentExams(mosqueId?: string, limit = 5) {
    const where: any = { status: ExamStatus.COMPLETED };
    if (mosqueId) {
      where.mosqueId = mosqueId;
    }

    return this.examRepository.find({
      where,
      relations: ["student", "examiner"],
      order: { date: "DESC", createdAt: "DESC" },
      take: limit,
    });
  }

  /**
   * Calculate achieved score for a question based on mistakes
   * Formula: achievedScore = maxScore - (mistakesCount * POINTS_PER_MISTAKE)
   *
   * @param examId - Exam ID
   * @param dto - Question DTO
   * @returns ExamQuestion entity with calculated score
   */
  private calculateQuestionScore(
    examId: string,
    dto: ExamQuestionDto,
  ): ExamQuestion {
    const deduction = dto.mistakesCount * POINTS_PER_MISTAKE;
    const achievedScore = Math.max(0, Math.round(dto.maxScore - deduction));

    return this.examQuestionRepository.create({
      examId,
      type: dto.type,
      questionText: dto.questionText ?? null,
      mistakesCount: dto.mistakesCount,
      maxScore: dto.maxScore,
      achievedScore,
    });
  }
}
