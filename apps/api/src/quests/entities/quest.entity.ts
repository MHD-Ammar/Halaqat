/**
 * Quest Entity
 *
 * Represents a granular task/habit that students can complete for XP rewards.
 * Quests can be global (circleId = null, created by admins) or circle-scoped
 * (circleId set, created by teachers for their circle).
 */

import { QuestCategory, QuestFrequency } from "@halaqat/types";
import { Entity, Column, Index, OneToMany, ManyToOne, JoinColumn } from "typeorm";

import { QuestCompletion } from "./quest-completion.entity";
import { Circle } from "../../circles/entities/circle.entity";
import { BaseEntity } from "../../common/entities/base.entity";

@Entity("quest")
export class Quest extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({
    type: "enum",
    enum: QuestCategory,
  })
  @Index()
  category!: QuestCategory;

  @Column({
    type: "enum",
    enum: QuestFrequency,
  })
  @Index()
  frequency!: QuestFrequency;

  @Column({ name: "xp_reward", type: "int" })
  xpReward!: number;

  @Column({ type: "varchar", length: 50, default: "⭐" })
  icon!: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  @Index()
  isActive!: boolean;

  /** Target count for multi-step quests (null or 1 = single-step) */
  @Column({ type: "int", default: 1 })
  target!: number;

  /** Unit label for progress display (e.g., "صفحات", "مرات") */
  @Column({ name: "target_unit", type: "varchar", length: 50, nullable: true })
  targetUnit!: string | null;

  // ── Circle Scoping ────────────────────────────────────────────
  // null = global quest (admin-created), set = circle-specific (teacher-created)

  @ManyToOne(() => Circle, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "circle_id" })
  circle!: Circle | null;

  @Column({ name: "circle_id", type: "uuid", nullable: true })
  @Index()
  circleId!: string | null;

  @OneToMany(() => QuestCompletion, (completion) => completion.quest)
  completions!: QuestCompletion[];
}
