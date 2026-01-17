/**
 * Progress Service
 *
 * Business logic for tracking student progress (recitations).
 * Integrates with PointsService for automatic point awards.
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RecitationQuality } from "@halaqat/types";

import { Recitation } from "./entities/recitation.entity";
import { RecordRecitationDto } from "./dto/record-recitation.dto";
import { PointsService } from "../points/points.service";

/**
 * Mapping from RecitationQuality to PointRule key
 */
const QUALITY_TO_RULE_KEY: Record<RecitationQuality, string> = {
  [RecitationQuality.EXCELLENT]: "RECITATION_EXCELLENT",
  [RecitationQuality.VERY_GOOD]: "RECITATION_VERY_GOOD",
  [RecitationQuality.GOOD]: "RECITATION_GOOD",
  [RecitationQuality.ACCEPTABLE]: "RECITATION_ACCEPTABLE",
  [RecitationQuality.POOR]: "RECITATION_POOR",
};

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Recitation)
    private recitationRepository: Repository<Recitation>,
    private pointsService: PointsService,
  ) {}

  /**
   * Record a student recitation and award points automatically
   */
  async recordRecitation(dto: RecordRecitationDto): Promise<Recitation> {
    // Create recitation record
    const recitation = this.recitationRepository.create({
      studentId: dto.studentId,
      sessionId: dto.sessionId,
      surahId: dto.surahId,
      startVerse: dto.startVerse,
      endVerse: dto.endVerse,
      type: dto.type,
      quality: dto.quality,
      mistakesCount: dto.mistakesCount || 0,
      notes: dto.notes || null,
    });

    await this.recitationRepository.save(recitation);

    // Award points based on quality
    const ruleKey = QUALITY_TO_RULE_KEY[dto.quality];
    await this.pointsService.calculateAndAwardPoints(
      dto.studentId,
      ruleKey,
      dto.sessionId,
    );

    // Load full recitation with relations
    return this.findOne(recitation.id);
  }

  /**
   * Get a single recitation by ID
   */
  async findOne(id: string): Promise<Recitation> {
    const recitation = await this.recitationRepository.findOne({
      where: { id },
      relations: ["student", "session", "surah"],
    });

    if (!recitation) {
      throw new NotFoundException(`Recitation with ID ${id} not found`);
    }

    return recitation;
  }

  /**
   * Get all recitations for a student
   */
  async getStudentRecitations(
    studentId: string,
    limit: number = 50,
  ): Promise<Recitation[]> {
    return this.recitationRepository.find({
      where: { studentId },
      relations: ["surah", "session"],
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  /**
   * Get all recitations for a session
   */
  async getSessionRecitations(sessionId: string): Promise<Recitation[]> {
    return this.recitationRepository.find({
      where: { sessionId },
      relations: ["student", "surah"],
      order: { createdAt: "ASC" },
    });
  }
}
