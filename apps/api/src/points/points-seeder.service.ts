/**
 * Points Seeder Service
 *
 * Seeds the database with default point rules on application bootstrap.
 * @module points
 */

import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PointRule } from "./entities/point-rule.entity";
import { POINT_RULE_DATA } from "./data/point-rule.data";

@Injectable()
export class PointsSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PointsSeederService.name);

  constructor(
    @InjectRepository(PointRule)
    private pointRuleRepository: Repository<PointRule>,
  ) {}

  /**
   * Seed data on application startup
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.seedPointRules();
  }

  /**
   * Seed default point rules
   * Uses upsert to avoid duplicates
   */
  async seedPointRules(): Promise<void> {
    this.logger.log("Starting Point Rules seeding...");

    try {
      for (const ruleData of POINT_RULE_DATA) {
        // Check if rule exists
        const existing = await this.pointRuleRepository.findOne({
          where: { key: ruleData.key },
        });

        if (!existing) {
          await this.pointRuleRepository.save(
            this.pointRuleRepository.create(ruleData),
          );
          this.logger.log(`Created point rule: ${ruleData.key}`);
        }
      }

      this.logger.log(`Point Rules seeding complete`);
    } catch (error) {
      this.logger.error("Failed to seed Point Rules", error);
    }
  }
}
