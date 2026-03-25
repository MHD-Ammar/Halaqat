import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webPush from 'web-push';

import { PushSubscription } from './entities/push-subscription.entity';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string; // app icon URL
  badge?: string;
  tag?: string; // dedup tag
  data?: {
    url?: string; // URL to open on click
  };
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(PushSubscription)
    private readonly pushSubRepo: Repository<PushSubscription>,
  ) {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webPush.setVapidDetails(
        'mailto:admin@halaqat.app',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY,
      );
    } else {
      this.logger.warn('VAPID keys not configured. Web push notifications will not work.');
    }
  }

  async subscribe(studentId: string, subscription: any) {
    const existing = await this.pushSubRepo.findOne({
      where: { studentId, endpoint: subscription.endpoint },
    });

    if (existing) {
      existing.isActive = true;
      existing.authKey = subscription.keys.auth;
      existing.p256dhKey = subscription.keys.p256dh;
      await this.pushSubRepo.save(existing);
      return { success: true };
    }

    const created = this.pushSubRepo.create({
      studentId,
      endpoint: subscription.endpoint,
      authKey: subscription.keys.auth,
      p256dhKey: subscription.keys.p256dh,
    });
    
    await this.pushSubRepo.save(created);
    return { success: true };
  }

  async unsubscribe(studentId: string, endpoint: string) {
    await this.pushSubRepo.delete({ studentId, endpoint });
    return { success: true };
  }

  async sendNotification(studentId: string, payload: NotificationPayload) {
    const subscriptions = await this.pushSubRepo.find({
      where: { studentId, isActive: true },
    });

    for (const sub of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { auth: sub.authKey, p256dh: sub.p256dhKey },
          },
          JSON.stringify(payload),
        );
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          sub.isActive = false;
          await this.pushSubRepo.save(sub);
        } else {
          this.logger.error(`Failed to send web push: ${error.message}`);
        }
      }
    }
  }

  async sendBulkNotification(studentIds: string[], payload: NotificationPayload) {
    const uniqueIds = Array.from(new Set(studentIds));
    for (const studentId of uniqueIds) {
      await this.sendNotification(studentId, payload);
    }
  }
}
