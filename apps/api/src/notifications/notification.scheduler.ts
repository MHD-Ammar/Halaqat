import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PushSubscription } from './entities/push-subscription.entity';
import { NotificationService } from './notification.service';
import { DailySubmission } from '../daily-challenge/entities/daily-submission.entity';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(PushSubscription)
    private readonly pushSubRepo: Repository<PushSubscription>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  @Cron('0 18 * * *', { timeZone: 'Asia/Riyadh' })
  async sendStreakRiskReminders() {
    this.logger.log('Running streak risk reminders...');
    const today = new Date().toISOString().split('T')[0]!;

    // Find active subscriptions
    const activeSubs = await this.pushSubRepo.createQueryBuilder('sub')
      .where('sub.is_active = true')
      .select('sub.student_id', 'studentId')
      .distinct(true)
      .getRawMany();

    if (activeSubs.length === 0) return;

    const studentIds = activeSubs.map(s => s.studentId);
    
    // Check students with streak > 0 who haven't submitted today
    const atRiskStudents = await this.studentRepo.createQueryBuilder('st')
      .leftJoin(DailySubmission, 'sub', 'sub.student_id = st.id AND sub.submission_date = :today', { today })
      .where('st.id IN (:...studentIds)', { studentIds })
      .andWhere('st.current_streak > 0')
      .andWhere('sub.id IS NULL')
      .getMany();

    if (atRiskStudents.length === 0) return;

    const idsToNotify = atRiskStudents.map(s => s.id);
    
    await this.notificationService.sendBulkNotification(idsToNotify, {
      title: 'تنبيه السلسلة! 🔥',
      body: 'سلسلتك في خطر! باقي بضع ساعات لإتمام ورد اليوم والحفاظ على سلسلتك.',
      data: { url: '/student-portal' },
    });
    
    this.logger.log(`Sent streak reminders to ${idsToNotify.length} students.`);
  }

  @Cron('0 16 * * *', { timeZone: 'Asia/Riyadh' })
  async sendDailyQuestReminder() {
    this.logger.log('Running daily quest reminders...');
    const today = new Date().toISOString().split('T')[0]!;

    const activeSubs = await this.pushSubRepo.createQueryBuilder('sub')
      .where('sub.is_active = true')
      .select('sub.student_id', 'studentId')
      .distinct(true)
      .getRawMany();

    if (activeSubs.length === 0) return;

    const studentIds = activeSubs.map(s => s.studentId);
    
    const pendingStudents = await this.studentRepo.createQueryBuilder('st')
      .leftJoin(DailySubmission, 'sub', 'sub.student_id = st.id AND sub.submission_date = :today', { today })
      .where('st.id IN (:...studentIds)', { studentIds })
      .andWhere('sub.id IS NULL')
      .getMany();

    if (pendingStudents.length === 0) return;

    const idsToNotify = pendingStudents.map(s => s.id);
    
    await this.notificationService.sendBulkNotification(idsToNotify, {
      title: 'ورد اليوم 📖',
      body: 'لم تكمل ورد اليوم بعد! هل أنت مستعد لإنجازه الآن؟',
      data: { url: '/student-portal' },
    });
    
    this.logger.log(`Sent daily reminders to ${idsToNotify.length} students.`);
  }

  // League result notification is tricky without directly coupling to League reset.
  // The service can expose a method to notify results, and we'll let LeagueService call it, or run a cron after LeagueService reset.
  @Cron('30 0 * * 0', { timeZone: 'UTC' })
  async sendLeagueResultsReminder() {
    // This is a placeholder since actual league results should be sent when league reset happens,
    // or we query newly created last week results.
    this.logger.log('League reset reminder would run here.');
  }
}
