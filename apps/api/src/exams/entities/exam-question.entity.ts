/**
 * ExamQuestion Entity
 *
 * Represents a single question within an exam.
 * Questions can be either CURRENT_PART (testing new material) or CUMULATIVE (reviewing previous parts).
 * Tracks mistakes and calculates achieved score based on the grading formula.
 */

import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { ExamQuestionType } from "@halaqat/types";

import { BaseEntity } from "../../common/entities/base.entity";
import { Exam } from "./exam.entity";

@Entity("exam_question")
export class ExamQuestion extends BaseEntity {
  /**
   * The exam this question belongs to
   * Relationship: Many Questions -> One Exam
   */
  @ManyToOne(() => Exam, (exam) => exam.questions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "exam_id" })
  exam!: Exam;

  /**
   * Foreign key for the exam
   */
  @Column({ name: "exam_id", type: "uuid" })
  @Index()
  examId!: string;

  /**
   * Type of question (CURRENT_PART or CUMULATIVE)
   */
  @Column({
    type: "enum",
    enum: ExamQuestionType,
  })
  type!: ExamQuestionType;

  /**
   * Optional question text (e.g., "Surah Al-Maida Verse 5")
   */
  @Column({ name: "question_text", type: "text", nullable: true })
  questionText!: string | null;

  /**
   * Number of mistakes made on this question
   */
  @Column({ name: "mistakes_count", type: "int", default: 0 })
  mistakesCount!: number;

  /**
   * Maximum possible score (weight) for this question
   */
  @Column({ name: "max_score", type: "int" })
  maxScore!: number;

  /**
   * Achieved score after deductions for mistakes
   * Calculated as: maxScore - deductions (based on 0.5 points per mistake)
   */
  @Column({ name: "achieved_score", type: "int", default: 0 })
  achievedScore!: number;
}
