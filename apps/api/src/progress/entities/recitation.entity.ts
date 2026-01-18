/**
 * Recitation Entity
 *
 * Records a student's Quran recitation during a session.
 * Tracks pages from Madinah Mushaf (1-604).
 */

import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { RecitationType, RecitationQuality } from "@halaqat/types";

import { BaseEntity } from "../../common/entities/base.entity";
import { Student } from "../../students/entities/student.entity";
import { Session } from "../../sessions/entities/session.entity";
import { Surah } from "../../curriculum/entities/surah.entity";

@Entity("recitation")
export class Recitation extends BaseEntity {
  /**
   * Type of recitation (new lesson or review)
   */
  @Column({
    type: "enum",
    enum: RecitationType,
  })
  type!: RecitationType;

  /**
   * Quality rating of the recitation
   */
  @Column({
    type: "enum",
    enum: RecitationQuality,
  })
  quality!: RecitationQuality;

  /**
   * Madinah Mushaf page number (1-604)
   */
  @Column({ name: "page_number", type: "int" })
  @Index()
  pageNumber!: number;

  /**
   * Number of mistakes made
   */
  @Column({ name: "mistakes_count", type: "int", default: 0 })
  mistakesCount!: number;

  /**
   * Optional notes from the teacher
   */
  @Column({ type: "text", nullable: true })
  notes!: string | null;

  /**
   * The student who recited
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
   * The session during which the recitation occurred
   */
  @ManyToOne(() => Session, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "session_id" })
  session!: Session;

  /**
   * Foreign key for the session
   */
  @Column({ name: "session_id", type: "uuid" })
  @Index()
  sessionId!: string;

  /**
   * Optional: The Surah being recited (metadata only)
   */
  @ManyToOne(() => Surah, { nullable: true })
  @JoinColumn({ name: "surah_id" })
  surah!: Surah | null;

  /**
   * Foreign key for the Surah (optional metadata)
   */
  @Column({ name: "surah_id", type: "int", nullable: true })
  surahId!: number | null;
}
