/**
 * Curriculum Service
 *
 * Business logic for curriculum data (Surahs, etc.)
 * Includes in-memory caching for page-to-surah lookups.
 * @module curriculum
 */

import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Surah } from "./entities/surah.entity";

/**
 * Cached surah info for fast page lookup
 */
interface CachedSurah {
  id: number;
  number: number;
  nameArabic: string;
  nameEnglish: string;
  startPage: number;
  endPage: number;
}

@Injectable()
export class CurriculumService implements OnModuleInit {
  private readonly logger = new Logger(CurriculumService.name);
  
  /**
   * In-memory cache: pageNumber -> surah info
   * Populated on module init for fast lookups
   */
  private pageToSurahCache: Map<number, CachedSurah> = new Map();
  
  /**
   * Array of all surahs for range-based lookup
   */
  private allSurahs: CachedSurah[] = [];

  constructor(
    @InjectRepository(Surah)
    private surahRepository: Repository<Surah>,
  ) {}

  /**
   * Load cache on module initialization
   */
  async onModuleInit(): Promise<void> {
    await this.loadSurahCache();
  }

  /**
   * Load all surahs into memory for fast page lookups
   */
  private async loadSurahCache(): Promise<void> {
    try {
      const surahs = await this.surahRepository.find({
        order: { number: "ASC" },
      });

      this.allSurahs = surahs.map((s) => ({
        id: s.id,
        number: s.number,
        nameArabic: s.nameArabic,
        nameEnglish: s.nameEnglish,
        startPage: s.startPage,
        endPage: s.endPage,
      }));

      // Build page-to-surah map
      this.pageToSurahCache.clear();
      for (const surah of this.allSurahs) {
        for (let page = surah.startPage; page <= surah.endPage; page++) {
          // If multiple surahs on same page, prefer the surah that starts on that page
          if (!this.pageToSurahCache.has(page) || surah.startPage === page) {
            this.pageToSurahCache.set(page, surah);
          }
        }
      }

      this.logger.log(`Loaded ${surahs.length} surahs into cache (${this.pageToSurahCache.size} pages mapped)`);
    } catch (error) {
      this.logger.error("Failed to load surah cache", error);
    }
  }

  /**
   * Find surah by page number using in-memory cache
   * O(1) lookup time
   */
  findSurahByPage(pageNumber: number): CachedSurah | null {
    return this.pageToSurahCache.get(pageNumber) || null;
  }

  /**
   * Get surah ID for a given page number
   * Returns null if page not found
   */
  getSurahIdByPage(pageNumber: number): number | null {
    const surah = this.findSurahByPage(pageNumber);
    return surah?.id || null;
  }

  /**
   * Get all surahs from cache
   */
  getAllCachedSurahs(): CachedSurah[] {
    return this.allSurahs;
  }

  /**
   * Get all Surahs sorted by number from DB
   */
  async findAllSurahs(): Promise<Surah[]> {
    return this.surahRepository.find({
      order: { number: "ASC" },
    });
  }

  /**
   * Get a single Surah by number
   */
  async findSurahByNumber(number: number): Promise<Surah | null> {
    return this.surahRepository.findOne({
      where: { number },
    });
  }

  /**
   * Get Surah by ID
   */
  async findSurahById(id: number): Promise<Surah | null> {
    return this.surahRepository.findOne({
      where: { id },
    });
  }

  /**
   * Reload cache (useful after data changes)
   */
  async reloadCache(): Promise<void> {
    await this.loadSurahCache();
  }
}

export type { CachedSurah };
