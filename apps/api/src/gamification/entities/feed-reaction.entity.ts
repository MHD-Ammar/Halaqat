import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('feed_reaction')
@Unique(['studentId', 'feedItemKey'])
export class FeedReaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_id', type: 'uuid' })
  @Index()
  studentId!: string;

  /** Composite key identifying the feed item: "q-{id}", "a-{id}", "m-{id}", etc. */
  @Column({ name: 'feed_item_key', type: 'varchar', length: 100 })
  @Index()
  feedItemKey!: string;

  @Column({ type: 'varchar', length: 20, default: 'congrats' })
  reaction!: string; // 'congrats', 'fire', 'heart'

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
