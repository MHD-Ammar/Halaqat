/**
 * Curriculum Service
 *
 * Business logic for curriculum data (Surahs, etc.)
 * @module curriculum
 */

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Surah } from "./entities/surah.entity";

@Injectable()
export class CurriculumService {
  constructor(
    @InjectRepository(Surah)
    private surahRepository: Repository<Surah>,
  ) {}

  /**
   * Get all Surahs sorted by number
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
}
