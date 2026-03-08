import { Entity, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';

import { StoreItem } from './store-item.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import { Student } from '../../students/entities/student.entity';

@Entity('store_purchase')
export class StorePurchase extends BaseEntity {
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ name: 'student_id', type: 'uuid' })
  @Index()
  studentId!: string;

  @ManyToOne(() => StoreItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item!: StoreItem;

  @Column({ name: 'item_id', type: 'uuid' })
  @Index()
  itemId!: string;

  @Column({ name: 'xp_spent', type: 'int' })
  xpSpent!: number;

  @CreateDateColumn({ name: 'purchased_at' })
  purchasedAt!: Date;
}
