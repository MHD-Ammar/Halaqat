/**
 * Mosques Service
 *
 * Handles mosque lookup and validation for multi-tenancy.
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Mosque } from "./entities/mosque.entity";

@Injectable()
export class MosquesService {
  constructor(
    @InjectRepository(Mosque)
    private mosqueRepository: Repository<Mosque>,
  ) {}

  /**
   * Find a mosque by its invite code
   * @param code - The 6-character invite code
   * @returns The mosque if found
   * @throws NotFoundException if code is invalid
   */
  async findByCode(code: string): Promise<Mosque> {
    const mosque = await this.mosqueRepository.findOne({
      where: { code },
    });

    if (!mosque) {
      throw new NotFoundException("Invalid invite code");
    }

    return mosque;
  }

  /**
   * Find a mosque by ID
   */
  async findById(id: string): Promise<Mosque | null> {
    return this.mosqueRepository.findOne({
      where: { id },
    });
  }

  /**
   * Get all mosques
   */
  async findAll(): Promise<Mosque[]> {
    return this.mosqueRepository.find({
      order: { name: "ASC" },
    });
  }
}
