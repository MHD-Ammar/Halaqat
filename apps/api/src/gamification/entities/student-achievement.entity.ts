import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";

import { Achievement } from "./achievement.entity";
import { BaseEntity } from "../../common/entities/base.entity";
import { Student } from "../../students/entities/student.entity";

@Entity("student_achievement")
@Index(["studentId", "achievementId"], { unique: true })
export class StudentAchievement extends BaseEntity {
  @ManyToOne(() => Student, { onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student!: Student;

  @Column({ name: "student_id", type: "uuid" })
  @Index()
  studentId!: string;

  @ManyToOne(() => Achievement, { onDelete: "CASCADE" })
  @JoinColumn({ name: "achievement_id" })
  achievement!: Achievement;

  @Column({ name: "achievement_id", type: "uuid" })
  @Index()
  achievementId!: string;

  @Column({ name: "unlocked_at", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  unlockedAt!: Date;
}
