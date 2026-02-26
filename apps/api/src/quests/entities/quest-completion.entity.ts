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
import { Student } from "../../students/entities/student.entity";

@Entity("quest_completion")
@Index(["studentId", "questId", "completedAt"])
export class QuestCompletion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "student_id", type: "uuid" })
  @Index()
  studentId!: string;

  @Column({ name: "quest_id", type: "uuid" })
  @Index()
  questId!: string;

  @Column({ name: "earned_xp", type: "int" })
  earnedXp!: number;

  @Column({ name: "completed_at", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  completedAt!: Date;

  @ManyToOne(() => Student, { onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student!: Student;

  @ManyToOne(() => Quest, (quest) => quest.completions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "quest_id" })
  quest!: Quest;
}
