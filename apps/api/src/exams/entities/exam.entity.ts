/**
 * Exam Entity
 *
 * Represents an exam session where an examiner tests a student on their Quran recitation.
 * Exams consist of 3-5 current part questions graded out of 100,
 * plus optional cumulative questions from previous parts.
 */

import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { ExamStatus } from "@halaqat/types";

import { BaseEntity } from "../../common/entities/base.entity";
import { Student } from "../../students/entities/student.entity";
import { User } from "../../users/entities/user.entity";
import { Mosque } from "../../mosques/entities/mosque.entity";

// Forward reference to avoid circular dependency
import type { ExamQuestion } from "./exam-question.entity";

@Entity("exam")
export class Exam extends BaseEntity {
  /**
   * The student being tested
   * Relationship: Many Exams -> One Student
   */
  @ManyToOne(() => Student, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "student_id" })
  student!: Student;

  /**
   * Foreign key for the student
   */
  @Column({ name: "student_id", type: "uuid" })
  @Index()
  studentId!: string;

  /**
   * The examiner conducting the test
   * Relationship: Many Exams -> One User (EXAMINER role)
   */
  @ManyToOne(() => User, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "examiner_id" })
  examiner!: User | null;

  /**
   * Foreign key for the examiner
   */
  @Column({ name: "examiner_id", type: "uuid", nullable: true })
  @Index()
  examinerId!: string | null;

  /**
   * Date of the exam
   */
  @Column({ type: "date" })
  @Index()
  date!: Date;

  /**
   * Final score out of 100 for the current part
   * Nullable until the exam is submitted
   */
  @Column({ type: "float", nullable: true })
  score!: number | null;

  /**
   * Exam status (PENDING/COMPLETED)
   */
  @Column({
    type: "enum",
    enum: ExamStatus,
    default: ExamStatus.PENDING,
  })
  status!: ExamStatus;

  /**
   * Optional notes about the exam
   */
  @Column({ type: "text", nullable: true })
  notes!: string | null;

  /**
   * Questions in this exam
   * Relationship: One Exam -> Many ExamQuestions
   */
  @OneToMany("ExamQuestion", "exam", { cascade: true })
  questions!: ExamQuestion[];

  /**
   * The mosque where this exam was conducted
   * Relationship: Many Exams -> One Mosque
   */
  @ManyToOne(() => Mosque, (mosque) => mosque.exams, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "mosque_id" })
  mosque!: Mosque;

  /**
   * Foreign key for the mosque
   */
  @Column({ name: "mosque_id", type: "uuid" })
  @Index()
  mosqueId!: string;
}
