/**
 * Points Seeder Service
 *
 * Seeds the database with default point rules on application bootstrap.
 * Creates rules per mosque for multi-tenancy support.
 * @module points
 */

import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { POINT_RULE_DATA } from "./data/point-rule.data";
import { PointRule } from "./entities/point-rule.entity";
import { Mosque } from "../mosques/entities/mosque.entity";

@Injectable()
export class PointsSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PointsSeederService.name);

  constructor(
    @InjectRepository(PointRule)
    private pointRuleRepository: Repository<PointRule>,
    @InjectRepository(Mosque)
    private mosqueRepository: Repository<Mosque>,
  ) {}

  /**
   * Seed data on application startup
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.seedPointRules();
  }

  /**
   * Seed default point rules for all mosques
   * Creates rules per mosque if they don't exist
   */
  async seedPointRules(): Promise<void> {
    this.logger.log("Starting Point Rules seeding...");

    try {
      // Get all mosques
      const mosques = await this.mosqueRepository.find();

      if (mosques.length === 0) {
        this.logger.warn("No mosques found, skipping point rules seeding");
        return;
      }

      for (const mosque of mosques) {
        await this.seedRulesForMosque(mosque.id);
      }

      this.logger.log(`Point Rules seeding complete for ${mosques.length} mosque(s)`);
    } catch (error) {
      this.logger.error("Failed to seed Point Rules", error);
    }
  }

  /**
   * Seed default rules for a specific mosque
   * @param mosqueId - The mosque to seed rules for
   */
  async seedRulesForMosque(mosqueId: string): Promise<void> {
    for (const ruleData of POINT_RULE_DATA) {
      // Check if rule exists for this mosque
      const existing = await this.pointRuleRepository.findOne({
        where: { key: ruleData.key, mosqueId },
      });

      if (!existing) {
        await this.pointRuleRepository.save(
          this.pointRuleRepository.create({
            ...ruleData,
            mosqueId,
          }),
        );
        this.logger.log(`Created point rule: ${ruleData.key} for mosque ${mosqueId}`);
      }
    }
  }
}
