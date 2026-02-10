/**
 * Points Service
 *
 * Business logic for managing points, including:
 * - Dynamic point calculation from rules (mosque-scoped)
 * - Teacher manual points with budget enforcement
 * - Custom reward rules management
 * - Point transactions ledger
 */

import { PointSourceType } from "@halaqat/types";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";

import { AddManualPointsDto } from "./dto/add-manual-points.dto";
import { AwardByRuleDto } from "./dto/award-by-rule.dto";
import { BulkUpdatePointRulesDto } from "./dto/bulk-update-point-rules.dto";
import { CreatePointRuleDto } from "./dto/create-point-rule.dto";
import { UpdatePointRuleDto } from "./dto/update-point-rule.dto";
import { PointRule } from "./entities/point-rule.entity";
import { PointTransaction } from "./entities/point-transaction.entity";
import { Mosque } from "../mosques/entities/mosque.entity";
import { Student } from "../students/entities/student.entity";

/**
 * Maximum manual points a teacher can award per session
 */
@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(PointRule)
    private pointRuleRepository: Repository<PointRule>,
    @InjectRepository(PointTransaction)
    private transactionRepository: Repository<PointTransaction>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Mosque)
    private mosqueRepository: Repository<Mosque>,
  ) {}

  // ==================== POINT RULES ====================

  /**
   * Get all point rules for a specific mosque
   * @param mosqueId - The mosque ID to filter by
   */
  async findAllRules(mosqueId: string): Promise<PointRule[]> {
    return this.pointRuleRepository.find({
      where: { mosqueId },
      order: { isSystem: "DESC", key: "ASC" },
    });
  }

  /**
   * Get teacher-visible rules for a mosque (for Quick Reward menu)
   * @param mosqueId - The mosque ID to filter by
   */
  async findTeacherVisibleRules(mosqueId: string): Promise<PointRule[]> {
    return this.pointRuleRepository.find({
      where: { mosqueId, isVisibleToTeacher: true, isActive: true },
      order: { isSystem: "DESC", description: "ASC" },
    });
  }

  /**
   * Get a rule by ID
   * @param ruleId - The rule ID
   */
  async findRuleById(ruleId: number): Promise<PointRule | null> {
    return this.pointRuleRepository.findOne({
      where: { id: ruleId },
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
        isSystem: true,
        isVisibleToTeacher: false, // System rules are not in teacher's Quick Reward
        isCustomEntry: false,
        maxCustomValue: null,
      }),
    );

    return this.pointRuleRepository.save(rules);
  }

  /**
   * Create a custom reward rule
   * @param mosqueId - The mosque ID
   * @param dto - The rule data
   */
  async createCustomRule(mosqueId: string, dto: CreatePointRuleDto): Promise<PointRule> {
    // Generate a unique key from description (uppercase, underscores)
    const baseKey = `CUSTOM_${dto.description
      .toUpperCase()
      .replace(/[^\w\u0600-\u06FF]+/g, "_")
      .replace(/^_+|_+$/g, "")}`;
    
    // Check for uniqueness and append number if needed
    let key = baseKey;
    let counter = 1;
    while (await this.findRuleByKey(key, mosqueId)) {
      key = `${baseKey}_${counter}`;
      counter++;
    }

    const rule = this.pointRuleRepository.create({
      key,
      description: dto.description,
      points: dto.points,
      mosqueId,
      isActive: true,
      isSystem: false,
      isVisibleToTeacher: dto.isVisibleToTeacher ?? true,
      isCustomEntry: dto.isCustomEntry ?? false,
      maxCustomValue: dto.isCustomEntry ? dto.maxCustomValue : null,
    });

    return this.pointRuleRepository.save(rule);
  }

  /**
   * Delete a custom rule (non-system rules only)
   * @param ruleId - The rule ID
   * @param mosqueId - The mosque ID (for authorization)
   */
  async deleteCustomRule(ruleId: number, mosqueId: string): Promise<void> {
    const rule = await this.pointRuleRepository.findOne({
      where: { id: ruleId, mosqueId },
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }

    if (rule.isSystem) {
      throw new ForbiddenException("System rules cannot be deleted");
    }

    await this.pointRuleRepository.remove(rule);
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
    multiplier: number = 1,
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
      amount: multiplier * rule.points,
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

  /**
   * Award points by rule ID (for teacher Quick Reward)
   * Supports both fixed-value and variable-input rules
   * @param dto - Award data including ruleId and optional customAmount
   * @param teacherId - The teacher awarding points
   * @param mosqueId - The mosque ID (for authorization)
   */
  async awardPointsByRule(
    dto: AwardByRuleDto,
    teacherId: string,
    mosqueId: string,
  ): Promise<PointTransaction> {
    const rule = await this.findRuleById(dto.ruleId);

    if (!rule || rule.mosqueId !== mosqueId) {
      throw new NotFoundException("Rule not found");
    }

    if (!rule.isActive) {
      throw new BadRequestException("This reward rule is not active");
    }

    // Determine the points to award
    let pointsToAward: number;
    if (rule.isCustomEntry) {
      // Variable-input rule: use the custom amount
      if (!dto.customAmount) {
        throw new BadRequestException("Custom amount is required for variable-input rules");
      }
      if (rule.maxCustomValue && dto.customAmount > rule.maxCustomValue) {
        throw new BadRequestException(
          `Points cannot exceed ${rule.maxCustomValue} for this rule`
        );
      }
      pointsToAward = dto.customAmount;
    } else {
      // Fixed-value rule: use the rule's default points
      pointsToAward = rule.points;
    }

    // Check teacher weekly budget (only for MANUAL rewards)
    if (pointsToAward > 0) {
      // Get config for mosque
      const mosque = await this.mosqueRepository.findOne({ where: { id: mosqueId } });
      const limit = mosque?.manualPointLimit ?? 20;

      const currentUsage = await this.getTeacherWeeklyBudgetUsage(
        teacherId,
        mosqueId,
      );

      const newTotal = currentUsage + pointsToAward;

      if (newTotal > limit) {
        throw new BadRequestException(
          `You have exceeded your weekly manual points limit. ` +
            `Limit: ${limit}, Used: ${currentUsage}, Requested: ${pointsToAward}`,
        );
      }
    }

    // Create transaction
    const transaction = this.transactionRepository.create({
      studentId: dto.studentId,
      amount: pointsToAward,
      reason: rule.description,
      sourceType: PointSourceType.MANUAL_REWARD,
      sessionId: dto.sessionId,
      awardedById: teacherId,
    });

    await this.transactionRepository.save(transaction);

    // Update student's total points
    await this.studentRepository.increment(
      { id: dto.studentId },
      "totalPoints",
      pointsToAward,
    );

    return transaction;
  }

  // ==================== MANUAL POINTS ====================

  /**
   * Add manual points with budget enforcement
   * Teachers are limited to manualPointLimit per week
   */
  async addManualPoints(
    dto: AddManualPointsDto,
    teacherId: string,
  ): Promise<PointTransaction> {
      // Get student's mosque to check limit
      // Assuming teacher is authorized to award to this student (checked by guard/roles)
      const student = await this.studentRepository.findOne({
        where: { id: dto.studentId },
        relations: ["mosque"],
      });
      
      if (!student) {
        throw new NotFoundException("Student not found");
      }

      const mosqueId = student.mosque.id;

    // Calculate current budget usage for this teacher in this week (only if positive reward)
    if (dto.amount > 0) {
      const mosque = await this.mosqueRepository.findOne({ where: { id: mosqueId } });
      const limit = mosque?.manualPointLimit ?? 20;

      const currentUsage = await this.getTeacherWeeklyBudgetUsage(
        teacherId,
        mosqueId,
      );

      const newTotal = currentUsage + dto.amount;

      if (newTotal > limit) {
        throw new BadRequestException(
          `You have exceeded your weekly manual points limit. ` +
            `Limit: ${limit}, Used: ${currentUsage}, Requested: ${dto.amount}`,
        );
      }
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
   * Get teacher's manual points budget usage for the current week (Sunday-Saturday)
   */
  async getTeacherWeeklyBudgetUsage(
    teacherId: string,
    _mosqueId: string, // Not strictly used for filtering transactions, but good for context if needed later
  ): Promise<number> {
    // Calculate start of week (Sunday 00:00:00)
    const now = new Date();
    const day = now.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diff = now.getDate() - day; // adjust when day is sunday
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const budgetTransactions = await this.transactionRepository.find({
      where: {
        awardedById: teacherId,
        createdAt: MoreThanOrEqual(startOfWeek),
        sourceType: PointSourceType.MANUAL_REWARD,
      },
    });

    const total = budgetTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0,
    );
    
    return total;


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
