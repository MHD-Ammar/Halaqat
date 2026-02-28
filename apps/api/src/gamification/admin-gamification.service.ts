import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Achievement } from "./entities/achievement.entity";
import { MilestoneReward } from "./entities/milestone-reward.entity";
import { Quest } from "../quests/entities/quest.entity";

@Injectable()
export class AdminGamificationService {
  constructor(
    @InjectRepository(Quest)
    private readonly questRepo: Repository<Quest>,
    @InjectRepository(MilestoneReward)
    private readonly milestoneRepo: Repository<MilestoneReward>,
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
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
}
