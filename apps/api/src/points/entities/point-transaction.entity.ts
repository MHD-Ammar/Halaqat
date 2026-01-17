/**
 * Point Transaction Entity
 *
 * Ledger of all point additions/deductions for students.
 */

import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { PointSourceType } from "@halaqat/types";

import { BaseEntity } from "../../common/entities/base.entity";
import { Student } from "../../students/entities/student.entity";
import { Session } from "../../sessions/entities/session.entity";

@Entity("point_transaction")
export class PointTransaction extends BaseEntity {
  /**
   * Point amount (positive for rewards, negative for penalties)
   */
  @Column({ type: "int" })
  amount!: number;

  /**
   * Human-readable reason for the points
   */
  @Column()
  reason!: string;

  /**
   * Source type of the points
   */
  @Column({
    type: "enum",
    enum: PointSourceType,
  })
  sourceType!: PointSourceType;

  /**
   * The student receiving the points
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
   * The session during which points were awarded (for budget tracking)
   */
  @ManyToOne(() => Session, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "session_id" })
  session!: Session | null;

  /**
   * Foreign key for the session
   */
  @Column({ name: "session_id", type: "uuid", nullable: true })
  @Index()
  sessionId!: string | null;

  /**
   * ID of the teacher who awarded manual points (for budget tracking)
   */
  @Column({ name: "awarded_by_id", type: "uuid", nullable: true })
  @Index()
  awardedById!: string | null;
}
