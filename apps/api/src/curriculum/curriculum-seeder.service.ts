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
   * Seed all 114 Surahs into the database with page ranges
   * Uses upsert to avoid duplicates and update existing
   */
  async seedSurahs(): Promise<void> {
    this.logger.log("Starting Surah seeding...");

    try {
      // Always upsert to ensure page ranges are updated
      for (const surahData of SURAH_DATA) {
        await this.surahRepository.upsert(
          {
            number: surahData.number,
            nameArabic: surahData.nameArabic,
            nameEnglish: surahData.nameEnglish,
            verseCount: surahData.verseCount,
            startPage: surahData.startPage,
            endPage: surahData.endPage,
            type: surahData.type,
          },
          ["number"], // Conflict on number column
        );
      }

      this.logger.log(`Successfully seeded ${SURAH_DATA.length} Surahs with page ranges`);
    } catch (error) {
      this.logger.error("Failed to seed Surahs", error);
    }
  }
}
