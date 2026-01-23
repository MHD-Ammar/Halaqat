/**
 * Student Entity
 *
 * Represents a student in a study circle (Halqa).
 * Students belong to one circle and can be quickly added with minimal info.
 */

import {
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";

import { BaseEntity } from "../../common/entities/base.entity";
import { Circle } from "../../circles/entities/circle.entity";
import { User } from "../../users/entities/user.entity";

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
   * Guardian/Parent name (optional)
   */
  @Column({ name: "guardian_name", type: "varchar", nullable: true })
  guardianName!: string | null;

  /**
   * Guardian/Parent phone number (optional)
   */
  @Column({ name: "guardian_phone", type: "varchar", nullable: true })
  guardianPhone!: string | null;

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

  /**
   * Total accumulated points for gamification
   */
  @Column({ name: "total_points", type: "int", default: 0 })
  totalPoints!: number;

  /**
   * Linked user account for portal access (optional)
   * Relationship: One Student -> One User
   */
  @OneToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  /**
   * Foreign key for the linked user account
   */
  @Column({ name: "user_id", type: "uuid", nullable: true })
  @Index()
  userId!: string | null;

  /**
   * Username for student login (auto-generated)
   */
  @Column({ type: "varchar", nullable: true, unique: true })
  @Index()
  username!: string | null;
}
