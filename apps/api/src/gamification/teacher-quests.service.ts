/**
 * Teacher Quests Service
 *
 * Business logic for teacher-created circle-scoped quests.
 * Teachers can only manage quests within their assigned circle(s).
 */

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { Circle } from "../circles/entities/circle.entity";
import { Quest } from "../quests/entities/quest.entity";

@Injectable()
export class TeacherQuestsService {
  constructor(
    @InjectRepository(Quest)
    private readonly questRepo: Repository<Quest>,
    @InjectRepository(Circle)
    private readonly circleRepo: Repository<Circle>,
  ) {}

  /**
   * Get the circle IDs owned by a teacher
   */
  private async getTeacherCircleIds(teacherId: string): Promise<string[]> {
    const circles = await this.circleRepo.find({
      where: { teacherId },
      select: ["id"],
    });
    return circles.map((c) => c.id);
  }

  /**
   * Ensure the teacher owns the given circleId
   */
  private async ensureCircleOwnership(
    teacherId: string,
    circleId: string,
  ): Promise<void> {
    const circle = await this.circleRepo.findOne({
      where: { id: circleId, teacherId },
    });
    if (!circle) {
      throw new ForbiddenException(
        "You do not have access to this circle",
      );
    }
  }

  /**
   * List all quests created for the teacher's circle(s)
   */
  async getQuests(teacherId: string) {
    const circleIds = await this.getTeacherCircleIds(teacherId);
    if (circleIds.length === 0) return [];

    return this.questRepo.find({
      where: { circleId: In(circleIds) },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Create a new circle-scoped quest.
   * Forces circleId to the teacher's first circle.
   */
  async createQuest(teacherId: string, data: Partial<Quest>) {
    const circleIds = await this.getTeacherCircleIds(teacherId);
    if (circleIds.length === 0) {
      throw new ForbiddenException("No circle assigned to you");
    }

    // Force circleId to teacher's circle (use first circle)
    const circleId = circleIds[0]!;

    const quest = this.questRepo.create({
      ...data,
      circleId,
      isActive: true,
    });
    return this.questRepo.save(quest);
  }

  /**
   * Update a circle-scoped quest (verify ownership first)
   */
  async updateQuest(teacherId: string, questId: string, data: Partial<Quest>) {
    const quest = await this.questRepo.findOne({ where: { id: questId } });
    if (!quest) throw new NotFoundException(`Quest with ID ${questId} not found`);
    if (!quest.circleId) {
      throw new ForbiddenException("Cannot edit global quests");
    }

    await this.ensureCircleOwnership(teacherId, quest.circleId);

    const originalCircleId = quest.circleId;
    Object.assign(quest, data);
    // Prevent overriding circleId
    quest.circleId = originalCircleId;
    return this.questRepo.save(quest);
  }

  /**
   * Delete a circle-scoped quest (verify ownership first)
   */
  async deleteQuest(teacherId: string, questId: string) {
    const quest = await this.questRepo.findOne({ where: { id: questId } });
    if (!quest) throw new NotFoundException(`Quest with ID ${questId} not found`);
    if (!quest.circleId) {
      throw new ForbiddenException("Cannot delete global quests");
    }

    await this.ensureCircleOwnership(teacherId, quest.circleId);

    const result = await this.questRepo.delete(questId);
    if (result.affected === 0) {
      throw new NotFoundException(`Quest with ID ${questId} not found`);
    }
  }
}
