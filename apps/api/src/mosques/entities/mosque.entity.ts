/**
 * Mosque Entity
 *
 * Represents a mosque in the multi-tenant Halaqat system.
 * Each user belongs to one mosque, identified by a unique invite code.
 */

import { Entity, Column, Index, OneToMany } from "typeorm";

import { BaseEntity } from "../../common/entities/base.entity";
import { User } from "../../users/entities/user.entity";
import { Circle } from "../../circles/entities/circle.entity";
import { Student } from "../../students/entities/student.entity";
import { Exam } from "../../exams/entities/exam.entity";
import { Session } from "../../sessions/entities/session.entity";

@Entity("mosque")
export class Mosque extends BaseEntity {
  /**
   * Name of the mosque
   */
  @Column()
  name!: string;

  /**
   * Unique 6-character invite code for registration
   */
  @Column({ type: "varchar", length: 6, unique: true })
  @Index()
  code!: string;

  /**
   * Users belonging to this mosque (Admins, Teachers, Examiners)
   */
  @OneToMany(() => User, (user) => user.mosque)
  users!: User[];

  /**
   * Study circles within this mosque
   */
  @OneToMany(() => Circle, (circle) => circle.mosque)
  circles!: Circle[];

  /**
   * Students enrolled at this mosque
   */
  @OneToMany(() => Student, (student) => student.mosque)
  students!: Student[];

  /**
   * Daily sessions conducted at this mosque
   */
  @OneToMany(() => Session, (session) => session.mosque)
  sessions!: Session[];

  /**
   * Exams conducted at this mosque
   */
  @OneToMany(() => Exam, (exam) => exam.mosque)
  exams!: Exam[];
}
