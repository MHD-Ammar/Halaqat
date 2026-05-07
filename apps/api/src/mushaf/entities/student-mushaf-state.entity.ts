/**
 * StudentMushafState Entity
 *
 * Persists a student's reading position in the Mushaf.
 * One-to-one relationship with Student — each student has exactly one state record.
 * Created lazily on first page view, updated on every page navigation.
 */

import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Student } from '../../students/entities/student.entity';

@Entity('student_mushaf_state')
export class StudentMushafState extends BaseEntity {
  // ── Student Relationship ──────────────────────────────────────

  /**
   * The student this state belongs to (1:1)
   */
  @OneToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  /**
   * Foreign key for the student (unique = 1:1 enforcement)
   */
  @Column({ name: 'student_id', type: 'uuid', unique: true })
  @Index()
  studentId!: string;

  // ── Reading Position ──────────────────────────────────────────

  /**
   * Last Madinah Mushaf page number the student was reading (1-604)
   */
  @Column({ name: 'last_page_number', type: 'int', default: 1 })
  lastPageNumber!: number;

  /**
   * Last Surah number (1-114) — optional metadata
   */
  @Column({ name: 'last_surah_number', type: 'int', nullable: true })
  lastSurahNumber!: number | null;

  /**
   * Last Ayah number within the surah — optional metadata
   */
  @Column({ name: 'last_ayah_number', type: 'int', nullable: true })
  lastAyahNumber!: number | null;
}
