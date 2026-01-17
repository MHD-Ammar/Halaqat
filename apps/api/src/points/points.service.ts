/**
 * Points Service
 *
 * Business logic for managing points, including:
 * - Dynamic point calculation from rules
 * - Teacher manual points with budget enforcement
 * - Point transactions ledger
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PointSourceType } from "@halaqat/types";

import { PointRule } from "./entities/point-rule.entity";
import { PointTransaction } from "./entities/point-transaction.entity";
import { AddManualPointsDto } from "./dto/add-manual-points.dto";
import { UpdatePointRuleDto } from "./dto/update-point-rule.dto";
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
   * Get all point rules
   */
  async findAllRules(): Promise<PointRule[]> {
    return this.pointRuleRepository.find({
      order: { key: "ASC" },
    });
  }

  /**
   * Get a point rule by key
   */
  async findRuleByKey(key: string): Promise<PointRule | null> {
    return this.pointRuleRepository.findOne({
      where: { key },
    });
  }

  /**
   * Update a point rule
   */
  async updateRule(key: string, dto: UpdatePointRuleDto): Promise<PointRule> {
    const rule = await this.pointRuleRepository.findOne({
      where: { key },
    });

    if (!rule) {
      throw new NotFoundException(`Point rule with key "${key}" not found`);
    }

    Object.assign(rule, dto);
    return this.pointRuleRepository.save(rule);
  }

  // ==================== POINT CALCULATION ====================

  /**
   * Calculate and award points based on a rule key
   * @param studentId - The student to award points to
   * @param ruleKey - The point rule key (e.g., RECITATION_EXCELLENT)
   * @param sessionId - The session during which points are awarded
   * @param reason - Optional custom reason (defaults to rule description)
   */
  async calculateAndAwardPoints(
    studentId: string,
    ruleKey: string,
    sessionId: string,
    reason?: string,
  ): Promise<PointTransaction | null> {
    // Look up the rule
    const rule = await this.findRuleByKey(ruleKey);

    if (!rule || !rule.isActive || rule.points === 0) {
      return null; // No points to award
    }

    // Determine source type based on rule key
    const sourceType = ruleKey.startsWith("ATTENDANCE")
      ? PointSourceType.ATTENDANCE
      : PointSourceType.RECITATION;

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
