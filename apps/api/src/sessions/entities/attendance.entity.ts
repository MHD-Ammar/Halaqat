/**
 * Attendance Entity
 *
 * Represents a student's attendance record for a session.
 */

import { AttendanceStatus } from "@halaqat/types";
import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from "typeorm";

import { Session } from "./session.entity";
import { BaseEntity } from "../../common/entities/base.entity";
import { Mosque } from "../../mosques/entities/mosque.entity";
import { Student } from "../../students/entities/student.entity";

// Composite index for mosque-scoped, time-ordered reads. Leftmost prefix
// (mosque_id) also serves plain mosque filters and backs the FK.
@Index(["mosqueId", "createdAt"])
@Entity("attendance")
@Unique(["sessionId", "studentId"]) // Prevent duplicate attendance records
export class Attendance extends BaseEntity {
  /**
   * Attendance status
   * Default is PRESENT - teacher only marks absentees
   */
  @Column({
    type: "enum",
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status!: AttendanceStatus;

  /**
   * The session this attendance belongs to
   */
  @ManyToOne(() => Session, (session) => session.attendances, {
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
   * The student this attendance record is for
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
   * The mosque this attendance belongs to.
   * Denormalized from the parent session so mosque-scoped analytics can filter
   * on an indexed column directly instead of joining through session/student.
   */
  @ManyToOne(() => Mosque, { onDelete: "CASCADE" })
  @JoinColumn({ name: "mosque_id" })
  mosque!: Mosque;

  /**
   * Foreign key for the mosque (always populated).
   */
  @Column({ name: "mosque_id", type: "uuid" })
  mosqueId!: string;
}
