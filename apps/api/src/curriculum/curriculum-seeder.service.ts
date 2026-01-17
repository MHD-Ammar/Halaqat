/**
 * Curriculum Seeder Service
 *
 * Seeds the database with reference data (Surahs) on application bootstrap.
 */

import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Surah } from "./entities/surah.entity";
import { SURAH_DATA } from "./data/surah.data";

@Injectable()
export class CurriculumSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CurriculumSeederService.name);

  constructor(
    @InjectRepository(Surah)
    private surahRepository: Repository<Surah>,
  ) {}

  /**
   * Seed data on application startup
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.seedSurahs();
  }

  /**
   * Seed all 114 Surahs into the database
   * Uses upsert to avoid duplicates
   */
  async seedSurahs(): Promise<void> {
    this.logger.log("Starting Surah seeding...");

    try {
      // Check if data already exists
      const existingCount = await this.surahRepository.count();

      if (existingCount === 114) {
        this.logger.log("Surahs already seeded (114 found). Skipping.");
        return;
      }

      // Upsert each Surah
      for (const surahData of SURAH_DATA) {
        await this.surahRepository.upsert(
          {
            number: surahData.number,
            nameArabic: surahData.nameArabic,
            nameEnglish: surahData.nameEnglish,
            verseCount: surahData.verseCount,
            type: surahData.type,
          },
          ["number"], // Conflict on number column
        );
      }

      this.logger.log(`Successfully seeded ${SURAH_DATA.length} Surahs`);
    } catch (error) {
      this.logger.error("Failed to seed Surahs", error);
    }
  }
}
