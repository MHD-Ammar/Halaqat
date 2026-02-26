import { QuestCategory } from "@halaqat/types";
import { Entity, Column } from "typeorm";

import { BaseEntity } from "../../common/entities/base.entity";

export enum AchievementCriteriaType {
  TOTAL_QUESTS_CATEGORY = "TOTAL_QUESTS_CATEGORY",
  STREAK_DAYS = "STREAK_DAYS",
  TOTAL_XP = "TOTAL_XP",
}

@Entity("achievement")
export class Achievement extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ name: "badge_icon", type: "varchar", length: 255 })
  badgeIcon!: string;

  @Column({
    name: "criteria_type",
    type: "enum",
    enum: AchievementCriteriaType,
  })
  criteriaType!: AchievementCriteriaType;

  @Column({ name: "criteria_target", type: "int" })
  criteriaTarget!: number;

  @Column({
    name: "criteria_category",
    type: "enum",
    enum: QuestCategory,
    nullable: true,
  })
  criteriaCategory!: QuestCategory | null;
}
