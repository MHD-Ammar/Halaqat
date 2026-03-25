import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  BaseEntity,
} from 'typeorm';

import { SeasonalEvent } from './seasonal-event.entity';
import { Quest } from '../../quests/entities/quest.entity';

@Entity('event_quest')
@Unique(['eventId', 'questId'])
@Index(['eventId', 'questId'])
export class EventQuest extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_id', type: 'uuid' })
  @Index()
  eventId!: string;

  @ManyToOne(() => SeasonalEvent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event!: SeasonalEvent;

  @Column({ name: 'quest_id', type: 'uuid' })
  @Index()
  questId!: string;

  @ManyToOne(() => Quest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quest_id' })
  quest!: Quest;

  /** Bonus XP on top of quest's normal XP for this event */
  @Column({ name: 'bonus_xp', type: 'int', default: 0 })
  bonusXp!: number;
}
