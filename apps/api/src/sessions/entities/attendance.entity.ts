/**
 * Attendance Entity
 *
 * Represents a student's attendance record for a session.
 */

import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from "typeorm";
import { AttendanceStatus } from "@halaqat/types";

import { BaseEntity } from "../../common/entities/base.entity";
import { Session } from "./session.entity";
import { Student } from "../../students/entities/student.entity";

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
}
