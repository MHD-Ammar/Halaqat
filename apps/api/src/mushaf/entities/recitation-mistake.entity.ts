/**
 * RecitationMistake Entity
 *
 * Captures word-level mistakes during a recitation session.
 * Each mistake pinpoints a specific word using the QuraniHub location format (surah:ayah:word).
 * Teachers log these by tapping words in the Mushaf Assessor UI.
 *
 * Relationships:
 * - ManyToOne → Recitation (the recitation session this mistake belongs to)
 * - ManyToOne → Student (denormalized for fast per-student queries)
 */

import { MistakeType } from "@halaqat/types";
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

import { BaseEntity } from "../../common/entities/base.entity";
import { Recitation } from "../../progress/entities/recitation.entity";
import { Student } from "../../students/entities/student.entity";

@Entity("recitation_mistake")
@Index(["studentId", "pageNumber"]) // Fast page-level lookups for Student Viewer
@Index(["studentId", "wordLocation"]) // For dedup and word-level queries
export class RecitationMistake extends BaseEntity {
  // ── Recitation Relationship ───────────────────────────────────

  /**
   * The recitation session this mistake was logged during
   */
  @ManyToOne(() => Recitation, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "recitation_id" })
  recitation!: Recitation | null;

  /**
   * Foreign key for the recitation
   */
  @Column({ name: "recitation_id", type: "uuid", nullable: true })
  @Index()
  recitationId!: string | null;

  // ── Student Relationship (denormalized) ───────────────────────

  /**
   * The student who made this mistake (denormalized from recitation for fast queries)
   */
  @ManyToOne(() => Student, { onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student!: Student;

  /**
   * Foreign key for the student
   */
  @Column({ name: "student_id", type: "uuid" })
  @Index()
  studentId!: string;

  // ── Word Location Data ────────────────────────────────────────

  /**
   * QuraniHub word location string: "surah:ayah:wordPosition"
   * Example: "2:255:3" = Al-Baqarah, Ayah 255, 3rd word
   * This is the primary identifier for the mistake's exact position
   */
  @Column({ name: "word_location", type: "varchar", length: 20 })
  wordLocation!: string;

  /**
   * Madinah Mushaf page number (1-604)
   * Denormalized for fast page-level queries (student viewer highlights)
   */
  @Column({ name: "page_number", type: "int" })
  pageNumber!: number;

  /**
   * Surah number (1-114)
   */
  @Column({ name: "surah_number", type: "int" })
  surahNumber!: number;

  /**
   * Ayah number within the surah
   */
  @Column({ name: "ayah_number", type: "int" })
  ayahNumber!: number;

  /**
   * Word position within the ayah (1-based)
   */
  @Column({ name: "word_position", type: "int" })
  wordPosition!: number;

  // ── Mistake Classification ────────────────────────────────────

  /**
   * Type of mistake: MEMORIZATION or TAJWEED
   */
  @Column({
    name: "mistake_type",
    type: "enum",
    enum: MistakeType,
  })
  mistakeType!: MistakeType;

  /**
   * Optional notes from the teacher about this specific mistake
   */
  @Column({ type: "text", nullable: true })
  notes!: string | null;
}
