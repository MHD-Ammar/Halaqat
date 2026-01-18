/**
 * Progress Service
 *
 * Business logic for tracking student progress (recitations).
 * Integrates with PointsService for automatic point awards.
 * Uses Madinah Mushaf pages (1-604) for tracking.
 * Auto-links pages to their corresponding Surahs.
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RecitationQuality } from "@halaqat/types";

import { Recitation } from "./entities/recitation.entity";
import { RecordRecitationDto } from "./dto/record-recitation.dto";
import { BulkRecitationDto } from "./dto/bulk-recitation.dto";
import { PointsService } from "../points/points.service";
import { CurriculumService } from "../curriculum/curriculum.service";

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

/**
 * Result of a bulk recitation creation
 */
export interface BulkRecitationResult {
  recitations: Recitation[];
  totalPointsAwarded: number;
  pageCount: number;
}

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Recitation)
    private recitationRepository: Repository<Recitation>,
    private pointsService: PointsService,
    private curriculumService: CurriculumService,
  ) {}

  /**
   * Record a single page recitation and award points automatically.
   * Auto-links the page to its corresponding Surah.
   */
  async recordRecitation(dto: RecordRecitationDto): Promise<Recitation> {
    // Auto-link: Get surahId from pageNumber using cached lookup
    const surahId = this.curriculumService.getSurahIdByPage(dto.pageNumber);

    // Create recitation record with auto-linked surahId
    const recitation = this.recitationRepository.create({
      studentId: dto.studentId,
      sessionId: dto.sessionId,
      pageNumber: dto.pageNumber,
      type: dto.type,
      quality: dto.quality,
      mistakesCount: dto.mistakesCount || 0,
      notes: dto.notes || null,
      surahId: surahId, // Auto-linked from page number
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
   * Record multiple pages in bulk with individual quality per page.
   * Each page gets its own point transaction and auto-linked surahId.
   */
  async recordBulkRecitation(dto: BulkRecitationDto): Promise<BulkRecitationResult> {
    const recitations: Recitation[] = [];
    let totalPointsAwarded = 0;

    // Process each page individually
    for (const detail of dto.details) {
      // Auto-link: Get surahId from pageNumber using cached lookup
      const surahId = this.curriculumService.getSurahIdByPage(detail.pageNumber);

      // Create recitation record for this page with auto-linked surahId
      const recitation = this.recitationRepository.create({
        studentId: dto.studentId,
        sessionId: dto.sessionId,
        pageNumber: detail.pageNumber,
        type: detail.type,
        quality: detail.quality,
        mistakesCount: 0,
        notes: null,
        surahId: surahId, // Auto-linked from page number
      });

      await this.recitationRepository.save(recitation);
      recitations.push(recitation);

      // Award points for this specific page
      const ruleKey = QUALITY_TO_RULE_KEY[detail.quality];
      const pointTransaction = await this.pointsService.calculateAndAwardPoints(
        dto.studentId,
        ruleKey,
        dto.sessionId,
      );

      if (pointTransaction) {
        totalPointsAwarded += pointTransaction.amount;
      }
    }

    return {
      recitations,
      totalPointsAwarded,
      pageCount: recitations.length,
    };
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

  /**
   * Get total distinct pages memorized by a student
   */
  async getTotalPagesMemorized(studentId: string): Promise<number> {
    const result = await this.recitationRepository
      .createQueryBuilder("r")
      .select("COUNT(DISTINCT r.pageNumber)", "count")
      .where("r.studentId = :studentId", { studentId })
      .getRawOne();

    return parseInt(result?.count || "0", 10);
  }
}
