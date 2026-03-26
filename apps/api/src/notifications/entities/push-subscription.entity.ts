import { Entity, Column, Index, ManyToOne, JoinColumn, CreateDateColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { Student } from '../../students/entities/student.entity';

@Entity('push_subscription')
@Unique(['studentId', 'endpoint'])
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_id', type: 'uuid' })
  @Index()
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  /** Push API endpoint URL */
  @Column({ type: 'text' })
  endpoint!: string;

  /** Web Push auth key (from PushSubscription.getKey('auth')) */
  @Column({ name: 'auth_key', type: 'text' })
  authKey!: string;

  /** Web Push p256dh key */
  @Column({ name: 'p256dh_key', type: 'text' })
  p256dhKey!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
