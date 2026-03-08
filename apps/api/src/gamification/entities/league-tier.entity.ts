import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("league_tier")
export class LeagueTier {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int", unique: true })
  rank!: number; // 1 = lowest, 5 = highest

  @Column({ type: "varchar" })
  name!: string;

  @Column({ name: "name_ar", type: "varchar" })
  nameAr!: string;

  @Column({ type: "varchar", length: 50 })
  icon!: string;

  @Column({ type: "varchar" })
  color!: string;

  @Column({ name: "promotion_slots", type: "int", default: 10 })
  promotionSlots!: number;

  @Column({ name: "relegation_slots", type: "int", default: 5 })
  relegationSlots!: number;

  @Column({ name: "xp_bonus", type: "int", default: 0 })
  xpBonus!: number;
}
