import { Entity, Column, Index } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

export enum StoreItemType {
  STREAK_SHIELD = 'STREAK_SHIELD',
  AVATAR_FRAME = 'AVATAR_FRAME',
  TITLE = 'TITLE',
  DOUBLE_XP = 'DOUBLE_XP',
  REAL_WORLD = 'REAL_WORLD', // Admin-configured physical prizes
}

@Entity('store_item')
export class StoreItem extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'name_ar', type: 'varchar', length: 255 })
  nameAr!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr!: string | null;

  @Column({ type: 'enum', enum: StoreItemType })
  @Index()
  type!: StoreItemType;

  /** XP cost to purchase */
  @Column({ name: 'xp_cost', type: 'int' })
  xpCost!: number;

  /** The value granted (e.g., "gold" for AVATAR_FRAME, "1" for STREAK_SHIELD count) */
  @Column({ name: 'reward_value', type: 'varchar' })
  rewardValue!: string;

  /** Emoji or icon for display */
  @Column({ type: 'varchar', length: 50, default: '🎁' })
  icon!: string;

  /** Whether this item is available for purchase */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  @Index()
  isActive!: boolean;

  /** Max purchases per student (null = unlimited) */
  @Column({ name: 'max_per_student', type: 'int', nullable: true })
  maxPerStudent!: number | null;

  /** Total stock available (null = unlimited) */
  @Column({ type: 'int', nullable: true })
  stock!: number | null;

  /** Minimum level required to see/buy this item */
  @Column({ name: 'min_level', type: 'int', default: 1 })
  minLevel!: number;

  /** Mosque-scoped (multi-tenancy) */
  @Column({ name: 'mosque_id', type: 'uuid' })
  @Index()
  mosqueId!: string;
}
