/**
 * Circle Entity
 *
 * Represents a study circle (Halqa) in the Halaqat system.
 * Each circle belongs to a teacher and can contain multiple students.
 */

import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from "typeorm";
import { Gender } from "@halaqat/types";

import { BaseEntity } from "../../common/entities/base.entity";
import { User } from "../../users/entities/user.entity";

// Forward reference to avoid circular dependency
import type { Student } from "../../students/entities/student.entity";

@Entity("circle")
export class Circle extends BaseEntity {
  /**
   * Circle name (e.g., "Abu Bakr As-Siddiq Circle")
   */
  @Column()
  name!: string;

  /**
   * Optional description of the circle
   */
  @Column({ type: "text", nullable: true })
  description!: string | null;

  /**
   * Optional location within the mosque
   */
  @Column({ type: "varchar", nullable: true })
  location!: string | null;

  /**
   * Gender segregation for the circle
   */
  @Column({
    type: "enum",
    enum: Gender,
    default: Gender.MALE,
  })
  gender!: Gender;

  /**
   * The teacher who leads this circle
   * Relationship: Many Circles -> One Teacher
   */
  @ManyToOne(() => User, (user) => user.circles, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "teacher_id" })
  teacher!: User | null;

  /**
   * Foreign key for the teacher
   * Explicitly defined for easy querying
   */
  @Column({ name: "teacher_id", type: "uuid", nullable: true })
  @Index()
  teacherId!: string | null;

  /**
   * Students enrolled in this circle
   * Relationship: One Circle -> Many Students
   */
  @OneToMany("Student", "circle")
  students!: Student[];
}

