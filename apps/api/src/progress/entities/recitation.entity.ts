/**
 * Recitation Entity
 *
 * Records a student's Quran recitation during a session.
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
   * Starting verse number
   */
  @Column({ name: "start_verse", type: "int" })
  startVerse!: number;

  /**
   * Ending verse number
   */
  @Column({ name: "end_verse", type: "int" })
  endVerse!: number;

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
   * The Surah being recited
   */
  @ManyToOne(() => Surah)
  @JoinColumn({ name: "surah_id" })
  surah!: Surah;

  /**
   * Foreign key for the Surah
   */
  @Column({ name: "surah_id", type: "int" })
  @Index()
  surahId!: number;
}
