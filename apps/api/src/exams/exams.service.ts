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

    // Calculate attempt number
    const previousAttempts = await this.examRepository.count({
      where: {
        studentId: dto.studentId,
        juzNumber: dto.juzNumber,
      },
    });
    const attemptNumber = previousAttempts + 1;

    const exam = new Exam();
    exam.studentId = dto.studentId;
    exam.examinerId = examinerId;
    exam.date = dto.date ? new Date(dto.date) : new Date();
    exam.notes = dto.notes ?? null;
    exam.status = ExamStatus.PENDING;
    exam.juzNumber = dto.juzNumber;
    exam.attemptNumber = attemptNumber;
    
    // Initialize scores as null
    exam.currentPartScore = null;
    exam.cumulativeScore = null;
    exam.finalScore = null;
    exam.passed = null;

    if (dto.testedParts) {
      exam.testedParts = dto.testedParts;
    }
    
    // Fetch student to get mosqueId if not provided
    if (!mosqueId) {
       const student = await this.studentsService.findOne(dto.studentId);
       if (!student) throw new NotFoundException("Student not found");
       exam.mosqueId = student.mosqueId;
    } else {
       exam.mosqueId = mosqueId;
    }

    return this.examRepository.save(exam);
  }

  /**
   * Submit an exam with questions and calculate the final score
   */
  async submitExam(examId: string, dto: SubmitExamDto): Promise<Exam> {
    const exam = await this.findOne(examId);

    if (exam.status === ExamStatus.COMPLETED) {
      throw new NotFoundException("Exam has already been completed");
    }

    // Save questions
    const questionEntities = dto.questions.map((q) =>
      this.calculateQuestionScore(examId, q),
    );
    await this.examQuestionRepository.save(questionEntities);

    // Update Scores
    exam.currentPartScore = dto.currentPartScore ?? null;
    exam.cumulativeScore = dto.cumulativeScore ?? null;
    exam.finalScore = dto.finalScore ?? null;
    
    exam.status = ExamStatus.COMPLETED;
    
    if (dto.notes) {
      exam.notes = dto.notes;
    }
    if (dto.testedParts) {
      exam.testedParts = dto.testedParts;
    }
    if (dto.passed !== undefined) {
      exam.passed = dto.passed;
    } else if (exam.finalScore !== null) {
      // Fallback: Pass if final score >= 70
       exam.passed = exam.finalScore >= 70;
    }

    return this.examRepository.save(exam);
  }

  /**
   * Find an exam by ID with all relations
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
   */
  async findByStudent(studentId: string): Promise<Exam[]> {
    return this.examRepository.find({
      where: { studentId },
      relations: ["examiner"],
      order: { date: "DESC" },
    });
  }

  /**
   * Search students for exam (scoped by mosque)
   */
  async searchStudents(term: string, mosqueId?: string) {
    if (!term) return [];
    
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);
    
    if (isUuid) {
      try {
        const student = await this.studentsService.findOne(term);
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
   * Returns a grid structure: 30 items for 30 Juz
   */
  async getStudentExamCard(studentId: string) {
    const exams = await this.examRepository.find({
      where: { studentId },
      order: { date: "DESC" }, // Newest first
    });

    // Initialize structure for 30 Juz
    // Shape: { 1: { juz: 1, attempts: [...] }, 2: ... }
    const card: Record<number, { juz: number; attempts: any[] }> = {};
    for (let i = 1; i <= 30; i++) {
        card[i] = { juz: i, attempts: [] };
    }

    // Populate with exam data
    for (const exam of exams) {
      // Focus on the MAIN juz tested (juzNumber)
      const juzNum = exam.juzNumber;
      if (juzNum && card[juzNum]) {
         card[juzNum].attempts.push({
             examId: exam.id,
             date: exam.date,
             score: exam.finalScore,
             passed: exam.passed, // Nullable
             attemptNumber: exam.attemptNumber,
             status: exam.passed === true ? 'PASSED' : exam.passed === false ? 'FAILED' : 'PENDING',
         });
      } else if (exam.testedParts && exam.testedParts.length > 0) {
          // Fallback for legacy data without juzNumber
          const mainPart = exam.testedParts[0];
          if (card[mainPart]) {
               card[mainPart].attempts.push({
                   examId: exam.id,
                   date: exam.date,
                   score: (exam as any).score ?? null, // Cast to any for legacy field
                   passed: exam.passed,
                   attemptNumber: 1, // Default for legacy
                   status: exam.passed === true ? 'PASSED' : exam.passed === false ? 'FAILED' : 'PENDING',
                   isLegacy: true
               });
          }
      }
    }

    // Sort attempts by attemptNumber ASC
    for (let i = 1; i <= 30; i++) {
        const idx = i; // storage const
        const partData = card[idx];
        if (partData && Array.isArray(partData.attempts)) {
            partData.attempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
        }
    }

    // Convert to array
    return Object.values(card);
  }

  /**
   * Get recent exams conducted
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
   * Calculate achieved score for a question
   */
  private calculateQuestionScore(
    examId: string,
    dto: ExamQuestionDto,
  ): ExamQuestion {
    const deduction = dto.mistakesCount * POINTS_PER_MISTAKE;
    const achievedScore = Math.max(0, Math.round(dto.maxScore - deduction));

    const q = this.examQuestionRepository.create({
      examId,
      type: dto.type,
      questionText: dto.questionText ?? null,
      mistakesCount: dto.mistakesCount,
      maxScore: dto.maxScore,
      achievedScore,
    });
    
    if (dto.questionJuzNumber) {
        q.questionJuzNumber = dto.questionJuzNumber;
    }
    
    return q;
  }
}
