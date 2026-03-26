import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { MilestoneReward } from "./milestone-reward.entity";
import { Student } from "../../students/entities/student.entity";

@Entity("student_milestones")
export class StudentMilestone {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: "CASCADE" })
  @JoinColumn({ name: "studentId" })
  student!: Student;

  @Column({ type: "uuid" })
  milestoneId!: string;

  @ManyToOne(() => MilestoneReward, { onDelete: "CASCADE" })
  @JoinColumn({ name: "milestoneId" })
  milestone!: MilestoneReward;

  @Column({ type: "boolean", default: false })
  isClaimed!: boolean;

  @Column({ type: "timestamp", nullable: true })
  unlockedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
