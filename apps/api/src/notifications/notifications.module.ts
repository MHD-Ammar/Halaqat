import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PushSubscription } from './entities/push-subscription.entity';
import { NotificationScheduler } from './notification.scheduler';
import { NotificationService } from './notification.service';
import { DailySubmission } from '../daily-challenge/entities/daily-submission.entity';
import { Student } from '../students/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PushSubscription, Student, DailySubmission])],
  providers: [NotificationService, NotificationScheduler],
  exports: [NotificationService],
})
export class NotificationsModule {}
