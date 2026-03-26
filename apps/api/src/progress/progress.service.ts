/**
 * Progress Service
 *
 * Business logic for tracking student progress (recitations).
 * Integrates with PointsService for automatic point awards.
 * Uses Madinah Mushaf pages (1-604) for tracking.
 * Auto-links pages to their corresponding Surahs.
 */

import { RecitationQuality } from "@halaqat/types";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual } from "typeorm";

import { calculateLevelFromXp } from "../common/constants/leveling-curve";
import { CurriculumService } from "../curriculum/curriculum.service";
import { MilestoneReward } from "../gamification/entities/milestone-reward.entity";
import { StudentMilestone } from "../gamification/entities/student-milestone.entity";
import { PointsService } from "../points/points.service";
import { BulkRecitationDto } from "./dto/bulk-recitation.dto";
import { RecordRecitationDto } from "./dto/record-recitation.dto";
import { Recitation } from "./entities/recitation.entity";
import { Student } from "../students/entities/student.entity";

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
 * Mapping from RecitationQuality to XP Rule key
 */
const QUALITY_TO_XP_RULE_KEY: Record<RecitationQuality, string> = {
  [RecitationQuality.EXCELLENT]: "XP_RECITATION_EXCELLENT",
  [RecitationQuality.VERY_GOOD]: "XP_RECITATION_VERY_GOOD",
  [RecitationQuality.GOOD]: "XP_RECITATION_GOOD",
  [RecitationQuality.ACCEPTABLE]: "XP_RECITATION_ACCEPTABLE",
  [RecitationQuality.POOR]: "XP_RECITATION_POOR",
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
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(MilestoneReward)
    private milestoneRewardRepo: Repository<MilestoneReward>,
    @InjectRepository(StudentMilestone)
    private studentMilestoneRepo: Repository<StudentMilestone>,
    private pointsService: PointsService,
    private curriculumService: CurriculumService,
  ) {}

  /**
   * Process level-ups and milestone unlocks
   */
  private async processMilestoneUnlocks(
    studentId: string,
    newLevel: number,
  ): Promise<StudentMilestone[]> {
    const eligibleMilestones = await this.milestoneRewardRepo.find({
      where: { targetLevel: LessThanOrEqual(newLevel) },
    });
    
    if (eligibleMilestones.length === 0) return [];

    const existing = await this.studentMilestoneRepo.find({
      where: { studentId },
    });
    
    const existingIds = new Set(existing.map((sm) => sm.milestoneId));
    const missing = eligibleMilestones.filter((m) => !existingIds.has(m.id));
    
    if (missing.length === 0) return [];

    const newStudentMilestones = missing.map((m) =>
      this.studentMilestoneRepo.create({
        studentId,
        milestoneId: m.id,
        isClaimed: false,
        unlockedAt: new Date(),
      }),
    );
    
    return this.studentMilestoneRepo.save(newStudentMilestones);
  }

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

    // Get student's mosqueId & current XP for point rule lookup
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId },
      select: ["id", "mosqueId", "totalXp", "currentLevel"],
    });

    let awardedXp = 0;

    // Award points based on quality + per-page points
    if (student?.mosqueId) {
      const ruleKey = QUALITY_TO_RULE_KEY[dto.quality];
      await this.pointsService.calculateAndAwardPoints(
        dto.studentId,
        ruleKey,
        student.mosqueId,
        dto.sessionId,
      );

      // Award XP
      const xpRuleKey = QUALITY_TO_XP_RULE_KEY[dto.quality];
      const xpRule = await this.pointsService.findRuleByKey(xpRuleKey, student.mosqueId);
      
      if (xpRule && xpRule.isActive) {
        awardedXp = xpRule.points;
      }

      // Also award per-page points (RECITATION_PAGE rule)
      await this.pointsService.calculateAndAwardPoints(
        dto.studentId,
        "RECITATION_PAGE",
        student.mosqueId,
        dto.sessionId,
      );
    }

    // Assign XP to recitation and update student
    recitation.xpAwarded = awardedXp;
    recitation.rewardSeen = false;
    await this.recitationRepository.save(recitation);

    if (student && awardedXp > 0) {
      const newTotalXp = student.totalXp + awardedXp;
      const newLevel = calculateLevelFromXp(newTotalXp);
      const levelUp = newLevel > student.currentLevel;

      await this.studentRepository.update(student.id, {
        totalXp: newTotalXp,
        currentLevel: newLevel,
      });

      if (levelUp) {
        await this.processMilestoneUnlocks(student.id, newLevel);
      }
    }

    // Load full recitation with relations
    return this.findOne(recitation.id);
  }

  /**
   * Record multiple pages in bulk with individual quality per page.
   * Each page gets its own point transaction and auto-linked surahId.
   */
  async recordBulkRecitation(
    dto: BulkRecitationDto,
  ): Promise<BulkRecitationResult> {
    const recitations: Recitation[] = [];
    let totalPointsAwarded = 0;

    // Get student's mosqueId & current XP once for all point calculations
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId },
      select: ["id", "mosqueId", "totalXp", "currentLevel"],
    });

    const recitationsToSave: Recitation[] = [];
    let totalXpToAward = 0;

    // Process each page individually
    for (const detail of dto.details) {
      // Auto-link: Get surahId from pageNumber using cached lookup
      const surahId = this.curriculumService.getSurahIdByPage(
        detail.pageNumber,
      );

      let awardedXp = 0;
      if (student?.mosqueId) {
        const xpRuleKey = QUALITY_TO_XP_RULE_KEY[detail.quality];
        const xpRule = await this.pointsService.findRuleByKey(xpRuleKey, student.mosqueId);
        if (xpRule && xpRule.isActive) {
          awardedXp = xpRule.points;
          totalXpToAward += awardedXp;
        }
      }

      // Create recitation record for this page with auto-linked surahId
      const recitation = this.recitationRepository.create({
        studentId: dto.studentId,
        sessionId: dto.sessionId,
        pageNumber: detail.pageNumber,
        type: detail.type,
        quality: detail.quality,
        mistakesCount: 0,
        notes: null,
        surahId: surahId, 
        xpAwarded: awardedXp,
        rewardSeen: false,
      });

      recitationsToSave.push(recitation);
    }

    const savedRecitations = await this.recitationRepository.save(recitationsToSave);
    recitations.push(...savedRecitations);

    // Award points
    if (student?.mosqueId) {
      const bulkAwards: Array<{ studentId: string; ruleKey: string }> = [];

      for (const detail of dto.details) {
        const ruleKey = QUALITY_TO_RULE_KEY[detail.quality];
        bulkAwards.push({ studentId: dto.studentId, ruleKey });
        bulkAwards.push({ studentId: dto.studentId, ruleKey: "RECITATION_PAGE" });
      }

      if (bulkAwards.length > 0) {
        const transactions = await this.pointsService.calculateAndAwardPointsBulk(
          student.mosqueId,
          dto.sessionId,
          bulkAwards
        );
        totalPointsAwarded = transactions.reduce((sum, t) => sum + t.amount, 0);
      }

      if (totalXpToAward > 0) {
        const newTotalXp = student.totalXp + totalXpToAward;
        const newLevel = calculateLevelFromXp(newTotalXp);
        const levelUp = newLevel > student.currentLevel;

        await this.studentRepository.update(student.id, {
          totalXp: newTotalXp,
          currentLevel: newLevel,
        });

        if (levelUp) {
          await this.processMilestoneUnlocks(student.id, newLevel);
        }
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
