/**
 * Quest Entity
 *
 * Represents a granular task/habit that students can complete for XP rewards.
 */

import { QuestCategory, QuestFrequency } from "@halaqat/types";
import { Entity, Column, Index, OneToMany } from "typeorm";


import { QuestCompletion } from "./quest-completion.entity";
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

  @OneToMany(() => QuestCompletion, (completion) => completion.quest)
  completions!: QuestCompletion[];
}
