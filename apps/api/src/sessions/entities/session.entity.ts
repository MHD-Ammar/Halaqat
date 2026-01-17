/**
 * Session Entity
 *
 * Represents a daily session/meeting of a study circle.
 */

import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from "typeorm";
import { SessionStatus } from "@halaqat/types";

import { BaseEntity } from "../../common/entities/base.entity";
import { Circle } from "../../circles/entities/circle.entity";

// Forward reference to avoid circular dependency
import type { Attendance } from "./attendance.entity";

@Entity("session")
export class Session extends BaseEntity {
  /**
   * Date of the session (only date part matters)
   */
  @Column({ type: "date" })
  @Index()
  date!: Date;

  /**
   * General notes for the session
   */
  @Column({ type: "text", nullable: true })
  notes!: string | null;

  /**
   * Session status (OPEN/CLOSED)
   */
  @Column({
    type: "enum",
    enum: SessionStatus,
    default: SessionStatus.OPEN,
  })
  status!: SessionStatus;

  /**
   * The circle this session belongs to
   */
  @ManyToOne(() => Circle, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "circle_id" })
  circle!: Circle;

  /**
   * Foreign key for the circle
   */
  @Column({ name: "circle_id", type: "uuid" })
  @Index()
  circleId!: string;

  /**
   * Attendance records for this session
   */
  @OneToMany("Attendance", "session", { cascade: true })
  attendances!: Attendance[];
}
