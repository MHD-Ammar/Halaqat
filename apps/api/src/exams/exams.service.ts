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

/** Points deducted per mistake for scoring calculation */
const POINTS_PER_MISTAKE = 0.5;

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    @InjectRepository(ExamQuestion)
    private examQuestionRepository: Repository<ExamQuestion>,
  ) {}

  /**
   * Create a new exam session
   *
   * @param examinerId - ID of the examiner creating the exam
   * @param dto - CreateExamDto with student ID and optional date/notes
   * @returns The created exam
   */
  async createExam(examinerId: string, dto: CreateExamDto): Promise<Exam> {
    const exam = this.examRepository.create({
      studentId: dto.studentId,
      examinerId,
      date: dto.date ? new Date(dto.date) : new Date(),
      notes: dto.notes ?? null,
      status: ExamStatus.PENDING,
    });

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

    // Update exam status and score
    exam.status = ExamStatus.COMPLETED;
    exam.score = finalScore;
    if (dto.notes) {
      exam.notes = dto.notes;
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
