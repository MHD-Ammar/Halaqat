/**
 * QuestCompletion Entity
 *
 * Records when a student completed a specific quest.
 */

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Quest } from "./quest.entity";
import { Mosque } from "../../mosques/entities/mosque.entity";
import { Student } from "../../students/entities/student.entity";

@Entity("quest_completion")
@Index(["studentId", "questId"])
@Index(["studentId", "questId", "completedAt"])
// Mosque-scoped activity feed filters by mosque and orders by completion time.
@Index(["mosqueId", "completedAt"])
export class QuestCompletion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "student_id", type: "uuid" })
  @Index()
  studentId!: string;

  @Column({ name: "quest_id", type: "uuid" })
  @Index()
  questId!: string;

  @Column({ name: "earned_xp", type: "int", default: 0 })
  earnedXp!: number;

  /** Current progress count (incremented on each "log" call) */
  @Column({ name: "current_progress", type: "int", default: 1 })
  currentProgress!: number;

  @Column({ name: "completed_at", type: "timestamp", nullable: true })
  completedAt!: Date | null;

  @ManyToOne(() => Student, { onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student!: Student;

  @ManyToOne(() => Quest, (quest) => quest.completions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "quest_id" })
  quest!: Quest;

  /**
   * The mosque this completion belongs to.
   * Denormalized from the owning student so the mosque activity feed and
   * per-mosque quest stats can filter on an indexed column without joining student.
   */
  @ManyToOne(() => Mosque, { onDelete: "CASCADE" })
  @JoinColumn({ name: "mosque_id" })
  mosque!: Mosque;

  @Column({ name: "mosque_id", type: "uuid" })
  mosqueId!: string;
}
