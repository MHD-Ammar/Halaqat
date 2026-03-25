import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';

import { EventQuest } from './entities/event-quest.entity';
import { SeasonalEvent } from './entities/seasonal-event.entity';

export interface ActiveEventResponse extends SeasonalEvent {
  remainingHours: number;
  remainingDays: number;
}

@Injectable()
export class SeasonalEventService {

  constructor(
    @InjectRepository(SeasonalEvent)
    private readonly eventRepo: Repository<SeasonalEvent>,
    @InjectRepository(EventQuest)
    private readonly eventQuestRepo: Repository<EventQuest>,
  ) {}

  /**
   * Get the currently active event for a mosque.
   * Active means isActive is true and current time is between startsAt and endsAt.
   */
  async getActiveEvent(mosqueId: string): Promise<SeasonalEvent | null> {
    const now = new Date();
    return this.eventRepo.findOne({
      where: {
        mosqueId,
        isActive: true,
        startsAt: LessThanOrEqual(now),
        endsAt: MoreThan(now),
      },
      order: { startsAt: 'DESC' },
    });
  }

  /**
   * Get all quests linked to a specific event.
   */
  async getEventQuests(eventId: string): Promise<EventQuest[]> {
    return this.eventQuestRepo.find({
      where: { eventId },
      relations: ['quest'],
    });
  }

  /**
   * Get the active event with additional countdown metadata.
   */
  async getActiveEventWithCountdown(mosqueId: string): Promise<ActiveEventResponse | null> {
    const event = await this.getActiveEvent(mosqueId);
    if (!event) return null;

    const now = new Date();
    const remainingMs = event.endsAt.getTime() - now.getTime();

    return {
      ...event,
      remainingHours: Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60))),
      remainingDays: Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60 * 24))),
    } as ActiveEventResponse;
  }

  /**
   * Check if a specific quest is part of an active event.
   */
  async getQuestBonusXp(mosqueId: string, questId: string): Promise<number> {
    const activeEvent = await this.getActiveEvent(mosqueId);
    if (!activeEvent) return 0;

    const eventQuest = await this.eventQuestRepo.findOne({
      where: { eventId: activeEvent.id, questId },
    });

    return eventQuest?.bonusXp ?? 0;
  }
}
