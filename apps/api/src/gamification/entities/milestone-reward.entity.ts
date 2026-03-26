import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum RewardType {
  BONUS_XP = "BONUS_XP",
  AVATAR_FRAME = "AVATAR_FRAME",
  TITLE = "TITLE",
}

@Entity("milestone_rewards")
export class MilestoneReward {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "int" })
  targetLevel!: number;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "enum", enum: RewardType, default: RewardType.BONUS_XP })
  rewardType!: RewardType;

  // e.g. "500" if BONUS_XP or an Image URL if AVATAR_FRAME
  @Column({ type: "varchar" })
  rewardValue!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
