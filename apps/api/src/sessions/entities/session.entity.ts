/**
 * Session Entity
 *
 * Represents a daily session/meeting of a study circle.
 */

import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { SessionStatus } from "@halaqat/types";

import { BaseEntity } from "../../common/entities/base.entity";
import { Circle } from "../../circles/entities/circle.entity";
import { Mosque } from "../../mosques/entities/mosque.entity";

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

  /**
   * The mosque where this session took place
   * Relationship: Many Sessions -> One Mosque
   */
  @ManyToOne(() => Mosque, (mosque) => mosque.sessions, {
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
