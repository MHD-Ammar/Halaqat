import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
} from 'typeorm';

@Entity('seasonal_event')
export class SeasonalEvent extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'name_ar', type: 'varchar', length: 255 })
  nameAr!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr!: string | null;

  /** Event start datetime (UTC) */
  @Column({ name: 'starts_at', type: 'timestamp' })
  startsAt!: Date;

  /** Event end datetime (UTC) */
  @Column({ name: 'ends_at', type: 'timestamp' })
  endsAt!: Date;

  /** Bonus XP multiplier during this event (e.g., 1.5 = 50% more XP) */
  @Column({
    name: 'xp_multiplier',
    type: 'decimal',
    precision: 3,
    scale: 1,
    default: 1.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  xpMultiplier!: number;

  /** Icon/emoji for the event */
  @Column({ type: 'varchar', length: 50, default: '🎉' })
  icon!: string;

  /** Theme color for UI styling */
  @Column({ name: 'theme_color', type: 'varchar', default: 'amber' })
  themeColor!: string;

  /** Banner image URL (optional) */
  @Column({ name: 'banner_url', type: 'varchar', nullable: true })
  bannerUrl!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'mosque_id', type: 'uuid' })
  @Index()
  mosqueId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
