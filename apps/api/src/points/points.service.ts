/**
 * Points Service
 *
 * Business logic for managing points, including:
 * - Dynamic point calculation from rules (mosque-scoped)
 * - Teacher manual points with budget enforcement
 * - Point transactions ledger
 */

import { PointSourceType } from "@halaqat/types";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AddManualPointsDto } from "./dto/add-manual-points.dto";
import { BulkUpdatePointRulesDto } from "./dto/bulk-update-point-rules.dto";
import { UpdatePointRuleDto } from "./dto/update-point-rule.dto";
import { PointRule } from "./entities/point-rule.entity";
import { PointTransaction } from "./entities/point-transaction.entity";
import { Student } from "../students/entities/student.entity";

/**
 * Maximum manual points a teacher can award per session
 */
const MANUAL_POINTS_BUDGET_PER_SESSION = 20;

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(PointRule)
    private pointRuleRepository: Repository<PointRule>,
    @InjectRepository(PointTransaction)
    private transactionRepository: Repository<PointTransaction>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  // ==================== POINT RULES ====================

  /**
   * Get all point rules for a specific mosque
   * @param mosqueId - The mosque ID to filter by
   */
  async findAllRules(mosqueId: string): Promise<PointRule[]> {
    return this.pointRuleRepository.find({
      where: { mosqueId },
      order: { key: "ASC" },
    });
  }

  /**
   * Get a point rule by key and mosque
   * @param key - The rule key
   * @param mosqueId - The mosque ID
   */
  async findRuleByKey(key: string, mosqueId: string): Promise<PointRule | null> {
    return this.pointRuleRepository.findOne({
      where: { key, mosqueId },
    });
  }

  /**
   * Initialize default point rules for a mosque
   * @param mosqueId - The mosque ID
   */
  async initializeDefaultRules(mosqueId: string): Promise<PointRule[]> {
    const defaultRules = [
      { key: "RECITATION_PAGE", description: "Memorizing a new page", points: 10 },
      { key: "RECITATION_EXCELLENT", description: "Excellent recitation quality", points: 50 },
      { key: "RECITATION_VERY_GOOD", description: "Very good recitation quality", points: 30 },
      { key: "RECITATION_GOOD", description: "Good recitation quality", points: 20 },
      { key: "RECITATION_ACCEPTABLE", description: "Acceptable recitation quality", points: 10 },
      { key: "RECITATION_POOR", description: "Poor recitation quality", points: 0 },
      { key: "ATTENDANCE_PRESENT", description: "Attending a session", points: 10 },
      { key: "ATTENDANCE_ON_TIME", description: "Arriving on time", points: 5 },
      { key: "EXAM_EXCELLENT", description: "Excellent exam score", points: 100 },
      { key: "EXAM_GOOD", description: "Good exam score", points: 80 },
    ];

    const rules = defaultRules.map((rule) =>
      this.pointRuleRepository.create({
        ...rule,
        mosqueId,
        isActive: true,
      }),
    );

    return this.pointRuleRepository.save(rules);
  }

  /**
   * Update a point rule for a specific mosque
   * @param key - The rule key
   * @param mosqueId - The mosque ID
   * @param dto - The update data
   */
  async updateRule(key: string, mosqueId: string, dto: UpdatePointRuleDto): Promise<PointRule> {
    const rule = await this.pointRuleRepository.findOne({
      where: { key, mosqueId },
    });

    if (!rule) {
      throw new NotFoundException(`Point rule with key "${key}" not found for this mosque`);
    }

    Object.assign(rule, dto);
    return this.pointRuleRepository.save(rule);
  }

  /**
   * Bulk update multiple point rules for a mosque
   * @param mosqueId - The mosque ID
   * @param dto - The bulk update data
   */
  async bulkUpdateRules(mosqueId: string, dto: BulkUpdatePointRulesDto): Promise<PointRule[]> {
    const updatedRules: PointRule[] = [];

    for (const ruleUpdate of dto.rules) {
      const rule = await this.pointRuleRepository.findOne({
        where: { key: ruleUpdate.key, mosqueId },
      });

      if (rule) {
        rule.points = ruleUpdate.points;
        await this.pointRuleRepository.save(rule);
        updatedRules.push(rule);
      }
    }

    return updatedRules;
  }

  // ==================== POINT CALCULATION ====================

  /**
   * Calculate and award points based on a rule key
   * @param studentId - The student to award points to
   * @param ruleKey - The point rule key (e.g., RECITATION_EXCELLENT)
   * @param mosqueId - The mosque ID to get the rule value from
   * @param sessionId - The session during which points are awarded
   * @param reason - Optional custom reason (defaults to rule description)
   */
  async calculateAndAwardPoints(
    studentId: string,
    ruleKey: string,
    mosqueId: string,
    sessionId: string,
    reason?: string,
  ): Promise<PointTransaction | null> {
    // Look up the rule for this specific mosque
    const rule = await this.findRuleByKey(ruleKey, mosqueId);

    if (!rule || !rule.isActive || rule.points === 0) {
      return null; // No points to award
    }

    // Determine source type based on rule key
    let sourceType: PointSourceType;
    if (ruleKey.startsWith("ATTENDANCE")) {
      sourceType = PointSourceType.ATTENDANCE;
    } else if (ruleKey.startsWith("EXAM")) {
      sourceType = PointSourceType.EXAM;
    } else {
      sourceType = PointSourceType.RECITATION;
    }

    // Create transaction
    const transaction = this.transactionRepository.create({
      studentId,
      amount: rule.points,
      reason: reason || rule.description,
      sourceType,
      sessionId,
    });

    await this.transactionRepository.save(transaction);

    // Update student's total points
    await this.studentRepository.increment(
      { id: studentId },
      "totalPoints",
      rule.points,
    );

    return transaction;
  }

  // ==================== MANUAL POINTS ====================

  /**
   * Add manual points with budget enforcement
   * Teachers are limited to MANUAL_POINTS_BUDGET_PER_SESSION per session
   */
  async addManualPoints(
    dto: AddManualPointsDto,
    teacherId: string,
  ): Promise<PointTransaction> {
    // Calculate current budget usage for this teacher in this session
    const currentUsage = await this.getTeacherSessionBudgetUsage(
      teacherId,
      dto.sessionId,
    );

    const newTotal = currentUsage + Math.abs(dto.amount);

    if (newTotal > MANUAL_POINTS_BUDGET_PER_SESSION) {
      throw new BadRequestException(
        `You have exceeded your manual points budget for this session. ` +
          `Budget: ${MANUAL_POINTS_BUDGET_PER_SESSION}, Used: ${currentUsage}, Requested: ${Math.abs(dto.amount)}`,
      );
    }

    // Determine source type
    const sourceType =
      dto.amount >= 0
        ? PointSourceType.MANUAL_REWARD
        : PointSourceType.MANUAL_PENALTY;

    // Create transaction
    const transaction = this.transactionRepository.create({
      studentId: dto.studentId,
      amount: dto.amount,
      reason: dto.reason,
      sourceType,
      sessionId: dto.sessionId,
      awardedById: teacherId,
    });

    await this.transactionRepository.save(transaction);

    // Update student's total points
    await this.studentRepository.increment(
      { id: dto.studentId },
      "totalPoints",
      dto.amount,
    );

    return transaction;
  }

  /**
   * Get teacher's manual points budget usage for a session
   */
  async getTeacherSessionBudgetUsage(
    teacherId: string,
    sessionId: string,
  ): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder("pt")
      .select("COALESCE(SUM(ABS(pt.amount)), 0)", "total")
      .where("pt.awarded_by_id = :teacherId", { teacherId })
      .andWhere("pt.session_id = :sessionId", { sessionId })
      .andWhere("pt.source_type IN (:...types)", {
        types: [PointSourceType.MANUAL_REWARD, PointSourceType.MANUAL_PENALTY],
      })
      .getRawOne();

    return parseInt(result?.total || "0", 10);
  }

  // ==================== POINT HISTORY ====================

  /**
   * Get point transaction history for a student
   */
  async getStudentHistory(
    studentId: string,
    limit: number = 50,
  ): Promise<PointTransaction[]> {
    return this.transactionRepository.find({
      where: { studentId },
      relations: ["session"],
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  /**
   * Get student's total points
   */
  async getStudentTotalPoints(studentId: string): Promise<number> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      select: ["totalPoints"],
    });

    return student?.totalPoints || 0;
  }
}
