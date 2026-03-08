import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { StoreItem, StoreItemType } from './entities/store-item.entity';
import { StorePurchase } from './entities/store-purchase.entity';
import { Student } from '../students/entities/student.entity';

export interface StoreItemWithStatus extends StoreItem {
  studentPurchaseCount: number;
  canAfford: boolean;
  meetsLevel: boolean;
  canPurchase: boolean;
}

export interface PurchaseResult {
  success: boolean;
  newTotalXp: number;
  itemName: string;
  itemType: StoreItemType;
}

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(StoreItem) private itemRepo: Repository<StoreItem>,
    @InjectRepository(StorePurchase) private purchaseRepo: Repository<StorePurchase>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    private dataSource: DataSource,
  ) {}

  /** Get all active store items for a mosque, with purchase count per student */
  async getStoreItems(studentId: string, mosqueId: string): Promise<StoreItemWithStatus[]> {
    const items = await this.itemRepo.find({
      where: { mosqueId, isActive: true },
      order: { xpCost: 'ASC' },
    });

    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const purchases = await this.purchaseRepo.find({
      where: { studentId },
    });

    return items.map(item => {
      const studentPurchaseCount = purchases.filter(p => p.itemId === item.id).length;
      const canAfford = student.totalXp >= item.xpCost;
      const meetsLevel = student.currentLevel >= item.minLevel;
      const withinLimit = item.maxPerStudent === null || studentPurchaseCount < item.maxPerStudent;
      const inStock = item.stock === null || item.stock > 0;

      return {
        ...item,
        studentPurchaseCount,
        canAfford,
        meetsLevel,
        canPurchase: canAfford && meetsLevel && withinLimit && inStock,
      };
    });
  }

  /** Purchase an item — deduct XP and apply the reward */
  async purchaseItem(studentId: string, itemId: string): Promise<PurchaseResult> {
    // Use transaction for atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const item = await queryRunner.manager.findOne(StoreItem, { where: { id: itemId } });
      if (!item) throw new NotFoundException('Item not found');
      if (!item.isActive) throw new BadRequestException('Item is not available');

      const student = await queryRunner.manager.findOne(Student, {
        where: { id: studentId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!student) throw new NotFoundException('Student not found');

      // Validate purchase
      if (student.totalXp < item.xpCost) throw new BadRequestException('Not enough XP');
      if (student.currentLevel < item.minLevel) throw new BadRequestException('Level too low');

      if (item.maxPerStudent !== null) {
        const count = await queryRunner.manager.count(StorePurchase, {
          where: { studentId, itemId },
        });
        if (count >= item.maxPerStudent) throw new BadRequestException('Purchase limit reached');
      }

      if (item.stock !== null) {
        if (item.stock <= 0) throw new BadRequestException('Out of stock');
        item.stock -= 1;
        await queryRunner.manager.save(item);
      }

      // Deduct XP
      student.totalXp -= item.xpCost;
      // NOTE: Do NOT recalculate level downward — XP spending doesn't lose levels

      // Apply the reward
      switch (item.type) {
        case StoreItemType.STREAK_SHIELD:
          student.streakShields = Math.min((student.streakShields ?? 0) + parseInt(item.rewardValue, 10), 3);
          break;
        case StoreItemType.AVATAR_FRAME:
          student.activeAvatarFrame = item.rewardValue;
          break;
        case StoreItemType.TITLE:
          student.activeTitle = item.rewardValue;
          break;
        case StoreItemType.DOUBLE_XP:
          // Store a "double XP until" timestamp (would need a new column)
          // For now, just grant bonus XP equal to rewardValue
          student.totalXp += parseInt(item.rewardValue, 10);
          break;
        case StoreItemType.REAL_WORLD:
          // No automatic application — admin fulfills manually
          break;
      }

      await queryRunner.manager.save(student);

      // Record purchase
      const purchase = queryRunner.manager.create(StorePurchase, {
        studentId, itemId, xpSpent: item.xpCost,
      });
      await queryRunner.manager.save(purchase);

      await queryRunner.commitTransaction();

      return {
        success: true,
        newTotalXp: student.totalXp,
        itemName: item.nameAr,
        itemType: item.type,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
