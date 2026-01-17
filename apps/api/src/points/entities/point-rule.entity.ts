/**
 * Point Rule Entity
 *
 * Configuration for point values. Admins can edit these to adjust gamification.
 */

import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("point_rule")
export class PointRule {
  /**
   * Auto-generated primary key
   */
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * Unique key for the rule (e.g., RECITATION_EXCELLENT)
   */
  @Column({ unique: true })
  @Index()
  key!: string;

  /**
   * Human-readable description
   */
  @Column()
  description!: string;

  /**
   * Point value for this rule
   */
  @Column({ type: "int" })
  points!: number;

  /**
   * Whether this rule is active
   */
  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
