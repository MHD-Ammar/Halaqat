import { StoreItemType } from "@halaqat/types";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Achievement } from "./entities/achievement.entity";
import { EventQuest } from "./entities/event-quest.entity";
import { MilestoneReward } from "./entities/milestone-reward.entity";
import { SeasonalEvent } from "./entities/seasonal-event.entity";
import { StoreItem } from "./entities/store-item.entity";
import { StorePurchase } from "./entities/store-purchase.entity";
import { Quest } from "../quests/entities/quest.entity";
import { Student } from "../students/entities/student.entity";

@Injectable()
export class AdminGamificationService {
  constructor(
    @InjectRepository(Quest)
    private readonly questRepo: Repository<Quest>,
    @InjectRepository(MilestoneReward)
    private readonly milestoneRepo: Repository<MilestoneReward>,
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(StoreItem)
    private readonly storeItemRepo: Repository<StoreItem>,
    @InjectRepository(SeasonalEvent)
    private readonly eventRepo: Repository<SeasonalEvent>,
    @InjectRepository(EventQuest)
    private readonly eventQuestRepo: Repository<EventQuest>,
    @InjectRepository(StorePurchase)
    private readonly purchaseRepo: Repository<StorePurchase>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  // --- Quests ---
  async getQuests() {
    return this.questRepo.find({
      order: { createdAt: "DESC" },
    });
  }

  async createQuest(data: Partial<Quest>) {
    const quest = this.questRepo.create(data);
    return this.questRepo.save(quest);
  }

  async updateQuest(id: string, data: Partial<Quest>) {
    const quest = await this.questRepo.findOne({ where: { id } });
    if (!quest) throw new NotFoundException(`Quest with ID ${id} not found`);
    Object.assign(quest, data);
    return this.questRepo.save(quest);
  }

  async deleteQuest(id: string) {
    const result = await this.questRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Quest with ID ${id} not found`);
    }
  }

  // --- Milestones ---
  async getMilestones() {
    return this.milestoneRepo.find({
      order: { targetLevel: "ASC" },
    });
  }

  async createMilestone(data: Partial<MilestoneReward>) {
    const milestone = this.milestoneRepo.create(data);
    return this.milestoneRepo.save(milestone);
  }

  async updateMilestone(id: string, data: Partial<MilestoneReward>) {
    const milestone = await this.milestoneRepo.findOne({ where: { id } });
    if (!milestone) throw new NotFoundException(`Milestone with ID ${id} not found`);
    Object.assign(milestone, data);
    return this.milestoneRepo.save(milestone);
  }

  async deleteMilestone(id: string) {
    const result = await this.milestoneRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }
  }

  // --- Achievements ---
  async getAchievements() {
    return this.achievementRepo.find({
      order: { createdAt: "DESC" },
    });
  }

  async createAchievement(data: Partial<Achievement>) {
    const achievement = this.achievementRepo.create(data);
    return this.achievementRepo.save(achievement);
  }

  async updateAchievement(id: string, data: Partial<Achievement>) {
    const achievement = await this.achievementRepo.findOne({ where: { id } });
    if (!achievement) throw new NotFoundException(`Achievement with ID ${id} not found`);
    Object.assign(achievement, data);
    return this.achievementRepo.save(achievement);
  }

  async deleteAchievement(id: string) {
    const result = await this.achievementRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Achievement with ID ${id} not found`);
    }
  }

  // --- Store Items ---
  async getStoreItems() {
    return this.storeItemRepo.find({
      order: { xpCost: "ASC" },
    });
  }

  async createStoreItem(mosqueId: string, data: Partial<StoreItem>) {
    const item = this.storeItemRepo.create({ ...data, mosqueId });
    return this.storeItemRepo.save(item);
  }

  async updateStoreItem(id: string, mosqueId: string, data: Partial<StoreItem>) {
    const item = await this.storeItemRepo.findOne({ where: { id, mosqueId } });
    if (!item) throw new NotFoundException(`Store item with ID ${id} not found`);
    Object.assign(item, data);
    return this.storeItemRepo.save(item);
  }

  async deleteStoreItem(id: string, mosqueId: string) {
    const result = await this.storeItemRepo.delete({ id, mosqueId });
    if (result.affected === 0) {
      throw new NotFoundException(`Store item with ID ${id} not found`);
    }
  }

  async toggleStoreItem(id: string, mosqueId: string) {
    const item = await this.storeItemRepo.findOne({ where: { id, mosqueId } });
    if (!item) throw new NotFoundException(`Store item with ID ${id} not found`);
    item.isActive = !item.isActive;
    return this.storeItemRepo.save(item);
  }

  // --- Seasonal Events ---
  async getEvents(mosqueId: string) {
    return this.eventRepo.find({
      where: { mosqueId },
      order: { startsAt: "DESC" },
    });
  }

  async createEvent(mosqueId: string, data: Partial<SeasonalEvent>) {
    const event = this.eventRepo.create({ ...data, mosqueId });
    return this.eventRepo.save(event);
  }

  async updateEvent(id: string, mosqueId: string, data: Partial<SeasonalEvent>) {
    const event = await this.eventRepo.findOne({ where: { id, mosqueId } });
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);
    Object.assign(event, data);
    return this.eventRepo.save(event);
  }

  async deleteEvent(id: string, mosqueId: string) {
    const result = await this.eventRepo.delete({ id, mosqueId });
    if (result.affected === 0) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
  }

  async addQuestToEvent(eventId: string, questId: string, bonusXp: number = 0) {
    const eventQuest = this.eventQuestRepo.create({ eventId, questId, bonusXp });
    return this.eventQuestRepo.save(eventQuest);
  }

  async removeQuestFromEvent(eventId: string, questId: string) {
    const result = await this.eventQuestRepo.delete({ eventId, questId });
    if (result.affected === 0) {
      throw new NotFoundException(`Quest ${questId} not found in event ${eventId}`);
    }
  }

  async getEventQuests(eventId: string) {
    return this.eventQuestRepo.find({
      where: { eventId },
      relations: ["quest"],
    });
  }

  // --- Store Fulfillments ---
  async getPendingFulfillments(mosqueId: string) {
    const purchases = await this.purchaseRepo.find({
      where: {
        item: { type: StoreItemType.REAL_WORLD, mosqueId },
        fulfillmentStatus: "pending",
      },
      relations: ["item", "student"],
      order: { purchasedAt: "ASC" },
    });

    return purchases.map((p) => ({
      id: p.id,
      studentName: p.student.name,
      studentId: p.studentId,
      itemName: p.item.nameAr,
      itemIcon: p.item.icon,
      xpSpent: p.xpSpent,
      purchasedAt: p.purchasedAt.toISOString(),
      fulfillmentStatus: p.fulfillmentStatus,
    }));
  }

  async updateFulfillmentStatus(
    id: string,
    mosqueId: string,
    status: "fulfilled" | "cancelled",
    notes?: string,
  ) {
    const purchase = await this.purchaseRepo.findOne({
      where: { id },
      relations: ["item"],
    });
    if (!purchase) throw new NotFoundException("Purchase not found");
    if (purchase.item.mosqueId !== mosqueId)
      throw new NotFoundException("Purchase not found");

    purchase.fulfillmentStatus = status;
    purchase.fulfillmentNotes = notes ?? null;
    if (status === "fulfilled") {
      purchase.fulfilledAt = new Date();
    }

    // If cancelled, refund XP
    if (status === "cancelled") {
      const student = await this.studentRepo.findOne({
        where: { id: purchase.studentId },
      });
      if (student) {
        student.totalXp += purchase.xpSpent;
        await this.studentRepo.save(student);
      }
    }

    return this.purchaseRepo.save(purchase);
  }
}
