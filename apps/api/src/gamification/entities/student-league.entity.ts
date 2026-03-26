import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

import { LeagueTier } from "./league-tier.entity";
import { Student } from "../../students/entities/student.entity";

@Entity("student_league")
@Unique(["studentId", "weekStart"])
export class StudentLeague {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "student_id", type: "uuid" })
  @Index()
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student!: Student;

  @Column({ name: "tier_id", type: "int" })
  tierId!: number;

  @ManyToOne(() => LeagueTier, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tier_id" })
  tier!: LeagueTier;

  /** ISO date string for the week start (Sunday) */
  @Column({ name: "week_start", type: "date" })
  @Index()
  weekStart!: string;

  /** XP earned THIS week only (for league ranking) */
  @Column({ name: "weekly_xp", type: "int", default: 0 })
  weeklyXp!: number;

  /** Final rank at end of week (null if week is still active) */
  @Column({ name: "final_rank", type: "int", nullable: true })
  finalRank!: number | null;

  /** Promotion/demotion result: 'promoted', 'relegated', 'stayed' */
  @Column({ type: "varchar", nullable: true })
  result!: "promoted" | "relegated" | "stayed" | null;

  /** Timestamp when this result was acknowledged by the student */
  @Column({ name: "result_seen_at", type: "timestamp", nullable: true })
  resultSeenAt!: Date | null;

  @Column({ name: "mosque_id", type: "uuid" })
  @Index()
  mosqueId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
