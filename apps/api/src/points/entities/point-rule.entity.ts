/**
 * Point Rule Entity
 *
 * Configuration for point values. Admins can edit these to adjust gamification.
 * Each mosque has its own set of rules, identified by (key, mosqueId).
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";

import { Mosque } from "../../mosques/entities/mosque.entity";

@Entity("point_rule")
@Unique(["key", "mosqueId"])
@Index(["key", "mosqueId"])
export class PointRule {
  /**
   * Auto-generated primary key
   */
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * Rule key (e.g., RECITATION_EXCELLENT). Unique per mosque.
   */
  @Column()
  key!: string;

  /**
   * Mosque this rule belongs to
   */
  @Column({ name: "mosque_id", type: "uuid" })
  mosqueId!: string;

  @ManyToOne(() => Mosque, { onDelete: "CASCADE" })
  @JoinColumn({ name: "mosque_id" })
  mosque!: Mosque;

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
