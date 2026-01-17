/**
 * Student Entity
 *
 * Represents a student in a study circle (Halqa).
 * Students belong to one circle and can be quickly added with minimal info.
 */

import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";

import { BaseEntity } from "../../common/entities/base.entity";
import { Circle } from "../../circles/entities/circle.entity";

@Entity("student")
export class Student extends BaseEntity {
  /**
   * Student's full name (required)
   */
  @Column()
  name!: string;

  /**
   * Parent's phone number (optional)
   */
  @Column({ type: "varchar", nullable: true })
  phone!: string | null;

  /**
   * Date of birth (optional)
   */
  @Column({ type: "date", nullable: true })
  dob!: Date | null;

  /**
   * Address (optional)
   */
  @Column({ type: "varchar", nullable: true })
  address!: string | null;

  /**
   * Medical or behavioral notes (optional)
   */
  @Column({ type: "text", nullable: true })
  notes!: string | null;

  /**
   * The circle this student belongs to
   * Relationship: Many Students -> One Circle
   */
  @ManyToOne(() => Circle, (circle) => circle.students, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "circle_id" })
  circle!: Circle | null;

  /**
   * Foreign key for the circle
   * Explicitly defined for easy querying
   */
  @Column({ name: "circle_id", type: "uuid", nullable: true })
  @Index()
  circleId!: string | null;
}
