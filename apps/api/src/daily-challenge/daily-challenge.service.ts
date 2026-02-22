 import {
  getCampaignConfig,
  getCampaignForm,
  CampaignConfig,
  QuestionScoringConfig,
  FormQuestion,
} from "@halaqat/types";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as ExcelJS from "exceljs";
import { Between, In, Repository } from "typeorm";

import { SubmitDailyChallengeDto } from "./dto/submit-daily-challenge.dto";
import { Campaign } from "./entities/campaign.entity";
import { DailySubmission } from "./entities/daily-submission.entity";
import { Circle } from "../circles/entities/circle.entity";
import { Mosque } from "../mosques/entities/mosque.entity";
import { Student } from "../students/entities/student.entity";

@Injectable()
export class DailyChallengeService {
  constructor(
    @InjectRepository(DailySubmission)
    private submissionRepo: Repository<DailySubmission>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Circle)
    private circleRepo: Repository<Circle>,
    @InjectRepository(Mosque)
    private mosqueRepo: Repository<Mosque>,
  ) {}

  /**
   * Helper to resolve legacy campaign keys (e.g. "ramadan") to actual database UUIDs
   */
  private async resolveCampaignId(campaignParam: string): Promise<string> {
    // If it's already a valid UUID, return it
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignParam)) {
      return campaignParam;
    }

    // Find the active campaign as fallback
    const activeCampaign = await this.submissionRepo.manager.findOne(Campaign, {
      where: { isActive: true },
      order: { createdAt: "DESC" },
    });

    if (activeCampaign) {
      return activeCampaign.id;
    }

    // Fallback to the first available campaign
    const firstCampaign = await this.submissionRepo.manager.findOne(Campaign, {
      order: { createdAt: "DESC" },
    });

    if (firstCampaign) {
      return firstCampaign.id;
    }

    throw new BadRequestException("No campaigns available");
  }

  /**
   * Submit daily challenge
   */
  async submit(dto: SubmitDailyChallengeDto) {
    const rawCampaignParam = (dto as any).campaignId || dto.campaignKey || "ramadan";
    const resolvedCampaignId = await this.resolveCampaignId(rawCampaignParam);

    const campaign = await this.submissionRepo.manager.findOne(Campaign, {
      where: { id: resolvedCampaignId }
    });

    if (!campaign) {
      throw new BadRequestException("Invalid campaign id");
    }

    // Retrieve form config - prefer DB config, fallback to legacy hardcoded types
    const config = Object.keys(campaign.formConfig || {}).length > 0 
      ? campaign.formConfig 
      : getCampaignConfig(rawCampaignParam);

    if (!config) {
        throw new BadRequestException("Invalid campaign config");
    }

    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId },
      relations: ["mosque"],
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    // Use client's local date if provided (to handle timezones), otherwise fallback to server UTC date
    const today = dto.localDate || new Date().toISOString().split("T")[0];

    if (!today) {
        throw new BadRequestException("Invalid date");
    }

    // Check for existing submission today for this campaign
    const existing = await this.submissionRepo.findOne({
      where: {
        studentId: dto.studentId,
        submissionDate: today,
        campaignId: resolvedCampaignId,
      },
    });

    if (existing) {
      throw new BadRequestException("You have already submitted for today!");
    }

    // Calculate XP
    const xpEarned = this.calculateXP(dto.submissionData, config as any);

    // Calculate Streak
    const streak = await this.calculateStreak(dto.studentId, today, resolvedCampaignId);

    // Create Submission
    const submission = this.submissionRepo.create({
      studentId: dto.studentId,
      mosqueId: student.mosqueId,
      submissionDate: today,
      submissionData: dto.submissionData,
      xpEarned,
      streak,
      campaignId: resolvedCampaignId,
    });

    return this.submissionRepo.save(submission);
  }

  /**
   * Calculate XP based on form data and campaign config (generic)
   */
  private calculateXP(data: any, config: CampaignConfig): number {
    let totalXp = config.submitted_xp || 0;
    const questions = config.questions || {};

    for (const [key, qConfig] of Object.entries<QuestionScoringConfig>(questions)) {
      const val = data[key];
      if (val === undefined || val === null) continue;

      switch (qConfig.type) {
        case "GRID":
          // val is { row: colValue, ... }
          if (typeof val === "object" && qConfig.xpMap) {
            Object.values(val).forEach((colVal: any) => {
              totalXp += qConfig.xpMap?.[colVal] || 0;
            });
          }
          break;
        case "BOOLEAN":
          totalXp += val === true ? (qConfig.xpYes || 0) : (qConfig.xpNo || 0);
          break;
        case "NUMBER": {
          const num = Math.min(Number(val) || 0, qConfig.max || Infinity);
          totalXp += num * (qConfig.multiplier || 0);
          break;
        }
      }
    }

    return totalXp;
  }

  /**
   * Calculate current streak
   */
  private async calculateStreak(
    studentId: string,
    todayStr: string,
    campaignId: string,
  ): Promise<number> {
    const yesterdayDate = new Date(todayStr);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

    const previousSubmission = await this.submissionRepo.findOne({
      where: {
        studentId,
        submissionDate: yesterdayStr,
        campaignId,
      },
    });

    return previousSubmission ? previousSubmission.streak + 1 : 1;
  }

  /**
   * Get circles for a mosque (Public)
   */
  async getCircles(mosqueId: string) {
    return this.circleRepo.find({
      where: { mosqueId },
      select: ["id", "name"],
      order: { name: "ASC" },
    });
  }

  /**
   * Get students for a circle (Public)
   */
  async getStudents(circleId: string) {
    return this.studentRepo.find({
      where: { circleId },
      select: ["id", "name"],
      order: { name: "ASC" },
    });
  }

  /**
   * Get student basic info + current streak (Public)
   */
  async getStudentInfo(studentId: string, campaignParam: string = "ramadan") {
    const campaignId = await this.resolveCampaignId(campaignParam);
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      select: ["id", "name"],
    });

    if (!student) throw new NotFoundException("Student not found");

    const lastSubmission = await this.submissionRepo.findOne({
      where: { studentId, campaignId },
      order: { submissionDate: "DESC" },
    });

    let currentStreak = 0;
    let hasSubmittedToday = false;

    if (lastSubmission) {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const lastDate = new Date(lastSubmission.submissionDate);
      const diffDays = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24),
      );

      if (diffDays <= 1) {
        currentStreak = lastSubmission.streak;
      }

      hasSubmittedToday = lastSubmission.submissionDate === todayStr;
    }

    return {
      ...student,
      currentStreak,
      lastSubmissionDate: lastSubmission?.submissionDate || null,
      hasSubmittedToday,
    };
  }

  /**
   * Find the first mosque ID (fallback for dev/testing)
   */
  async findFirstMosqueId() {
    const mosque = await this.mosqueRepo.findOne({
      where: {},
      select: ["id"],
    });
    return mosque?.id;
  }

  /**
   * Get Leaderboard (Public)
   */
  async getLeaderboard(mosqueId: string, campaignParam: string = "ramadan") {
    const campaignId = await this.resolveCampaignId(campaignParam);
    const results = await this.submissionRepo
      .createQueryBuilder("submission")
      .select("submission.studentId", "studentId")
      .addSelect("SUM(submission.xpEarned)", "totalXp")
      .addSelect("MAX(submission.streak)", "maxStreak")
      .innerJoin("submission.student", "student")
      .addSelect("student.name", "name")
      .where("submission.mosqueId = :mosqueId", { mosqueId })
      .andWhere("submission.campaignId = :campaignId", { campaignId })
      .groupBy("submission.studentId")
      .addGroupBy("student.name")
      .orderBy("SUM(submission.xpEarned)", "DESC")
      .limit(50)
      .getRawMany();

    const students = results.map((r) => ({
      studentId: r.studentId,
      name: r.name,
      totalXp: Number(r.totalXp),
      streak: Number(r.maxStreak),
    }));

    // Circle averages
    const circleResults = await this.submissionRepo
      .createQueryBuilder("submission")
      .select("student.circleId", "circleid")
      .addSelect("circle.name", "circlename")
      .addSelect("COUNT(DISTINCT submission.studentId)", "studentcount")
      .addSelect("SUM(submission.xpEarned)", "totalxp")
      .addSelect("AVG(sub_totals.studenttotal)", "avgxp")
      .innerJoin("submission.student", "student")
      .innerJoin("student.circle", "circle")
      .innerJoin(
        (qb) =>
          qb
            .select("s.studentId", "sid")
            .addSelect("SUM(s.xpEarned)", "studenttotal")
            .from("daily_submission", "s")
            .where("s.mosqueId = :mosqueId", { mosqueId })
            .andWhere("s.campaignId = :campaignId", { campaignId })
            .groupBy("s.studentId"),
        "sub_totals",
        "sub_totals.sid = submission.studentId",
      )
      .where("submission.mosqueId = :mosqueId", { mosqueId })
      .andWhere("submission.campaignId = :campaignId", { campaignId })
      .groupBy("student.circleId")
      .addGroupBy("circle.name")
      .orderBy("AVG(sub_totals.studenttotal)", "DESC")
      .getRawMany();

    const circleAverages = circleResults.map((r) => ({
      circleId: r.circleid,
      circleName: r.circlename,
      studentCount: Number(r.studentcount),
      totalXp: Number(r.totalxp),
      avgXp: Math.round(Number(r.avgxp)),
    }));

    return { students, circleAverages };
  }

  /**
   * Get Weekly Submissions for a Circle (Teacher View)
   */
  async getWeeklySubmissions(
    circleId: string,
    startDateStr: string,
    campaignParam: string = "ramadan",
  ) {
    const campaignId = await this.resolveCampaignId(campaignParam);
    const students = await this.studentRepo.find({
      where: { circleId },
      select: ["id", "name"],
      order: { name: "ASC" },
    });

    if (!students.length) {
      return [];
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const endDateStr = endDate.toISOString().split("T")[0];

    const submissions = await this.submissionRepo
      .createQueryBuilder("submission")
      .select([
        "submission.id",
        "submission.studentId",
        "submission.submissionDate",
        "submission.xpEarned",
        "submission.streak",
      ])
      .where("submission.studentId IN (:...studentIds)", {
        studentIds: students.map((s) => s.id),
      })
      .andWhere("submission.campaignId = :campaignId", { campaignId })
      .andWhere("submission.submissionDate >= :startDate", {
        startDate: startDateStr,
      })
      .andWhere("submission.submissionDate <= :endDate", { endDate: endDateStr })
      .getMany();

    return students.map((student) => {
      const studentSubmissions: Record<string, any> = {};
      submissions
        .filter((sub) => sub.studentId === student.id)
        .forEach((sub) => {
          studentSubmissions[sub.submissionDate] = {
            id: sub.id,
            xp: sub.xpEarned,
            streak: sub.streak,
          };
        });

      return {
        studentId: student.id,
        name: student.name,
        submissions: studentSubmissions,
      };
    });
  }

  /**
   * Get single submission by ID with full data
   */
  async getSubmissionById(id: string) {
    const submission = await this.submissionRepo.findOne({
      where: { id },
      relations: ["student"],
    });

    if (!submission) {
      throw new NotFoundException("Submission not found");
    }

    return {
      id: submission.id,
      studentName: submission.student.name,
      date: submission.submissionDate,
      totalXp: submission.xpEarned,
      details: submission.submissionData,
    };
  }

  // ─── Admin Methods ───────────────────────────────────────────────────────

  /**
   * Flatten a JSONB submission into a flat object using the form config.
   * Used by the Excel export engine.
   */
  private flattenSubmission(
    data: Record<string, any>,
    formQuestions: FormQuestion[],
  ): Record<string, string | number> {
    const flat: Record<string, string | number> = {};

    for (const question of formQuestions) {
      const val = data[question.id];

      switch (question.type) {
        case "GRID": {
          const rows = question.rows || [];
          const columns = question.columns || [];
          const gridData = (val as Record<string, string>) || {};

          for (const row of rows) {
            const colValue = gridData[row];
            const colLabel =
              columns.find((c) => c.value === colValue)?.label || colValue || "";
            flat[`${question.title} (${row})`] = colLabel;
          }
          break;
        }
        case "BOOLEAN":
          flat[question.title] = val === true ? "✓" : "✗";
          break;
        case "NUMBER":
          flat[question.title] = Number(val) || 0;
          break;
        default:
          flat[question.title] = String(val ?? "");
      }
    }

    return flat;
  }

  /**
   * Export submissions to Excel (Admin)
   * Returns an ExcelJS Workbook ready to stream.
   */
  async exportToExcel(
    campaignParam: string,
    startDate: string,
    endDate: string,
  ): Promise<ExcelJS.Workbook> {
    const campaignId = await this.resolveCampaignId(campaignParam);
    
    const campaign = await this.submissionRepo.manager.findOne(Campaign, { where: { id: campaignId } });
    if (!campaign) {
      throw new BadRequestException("Campaign not found");
    }

    // Determine the form questions properly based on fallback logic if necessary
    let formQuestions: FormQuestion[] = [];
    if (campaign.formConfig && campaign.formConfig.questions) {
      formQuestions = Object.entries(campaign.formConfig.questions).map(([id, q]: [string, any]) => ({
        id,
        ...q
      }));
    } else {
      // old fallback
      formQuestions = getCampaignForm(campaignParam);
    }

    // Fetch all submissions in range with relations
    const submissions = await this.submissionRepo.find({
      where: {
        campaignId,
        submissionDate: Between(startDate, endDate) as any,
      },
      relations: ["student", "student.circle"],
      order: { submissionDate: "ASC" },
    });

    // Build dynamic column headers from form config
    const dynamicHeaders: string[] = [];
    for (const q of formQuestions) {
      if (q.type === "GRID" && q.rows) {
        for (const row of q.rows) {
          dynamicHeaders.push(`${q.title} (${row})`);
        }
      } else {
        dynamicHeaders.push(q.title);
      }
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Submissions");

    // Define columns
    worksheet.columns = [
      { header: "التاريخ", key: "date", width: 14 },
      { header: "اسم الطالب", key: "studentName", width: 25 },
      { header: "الحلقة", key: "circleName", width: 20 },
      { header: "مجموع النقاط", key: "totalXp", width: 14 },
      ...dynamicHeaders.map((h) => ({ header: h, key: h, width: 20 })),
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center" as const };

    // Add data rows
    for (const sub of submissions) {
      const flat = this.flattenSubmission(sub.submissionData, formQuestions);

      worksheet.addRow({
        date: sub.submissionDate,
        studentName: sub.student?.name || "—",
        circleName: sub.student?.circle?.name || "—",
        totalXp: sub.xpEarned,
        ...flat,
      });
    }

    return workbook;
  }

  /**
   * Get paginated student submissions for Admin Dashboard.
   * Paginates students (not submissions) for consistent matrix view.
   */
  async getAdminSubmissionsList(
    page: number = 1,
    limit: number = 20,
    startDate: string,
    endDate: string,
    campaignParam: string = "ramadan",
  ) {
    const campaignId = await this.resolveCampaignId(campaignParam);
    const skip = (page - 1) * limit;

    // 1. Paginate students
    const [students, total] = await this.studentRepo.findAndCount({
      select: ["id", "name", "circleId"],
      relations: ["circle"],
      order: { name: "ASC" },
      skip,
      take: limit,
    });

    if (!students.length) {
      return {
        data: [],
        meta: { total, page, lastPage: Math.ceil(total / limit) || 1 },
      };
    }

    // 2. Fetch submissions for these students in range
    const studentIds = students.map((s) => s.id);
    const submissions = await this.submissionRepo.find({
      where: {
        studentId: In(studentIds),
        campaignId,
        submissionDate: Between(startDate, endDate) as any,
      },
      select: ["id", "studentId", "submissionDate", "xpEarned", "streak"],
    });

    // 3. Map to matrix format
    const data = students.map((student) => {
      const studentSubs: Record<string, any> = {};
      submissions
        .filter((s) => s.studentId === student.id)
        .forEach((s) => {
          studentSubs[s.submissionDate] = {
            id: s.id,
            xp: s.xpEarned,
            streak: s.streak,
          };
        });

      return {
        student: {
          id: student.id,
          name: student.name,
          circleName: student.circle?.name || null,
        },
        submissions: studentSubs,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Override Engine (Admin)
   * Manually update a past submission's data and XP.
   * Adjusts the student's total XP based on the delta.
   */
  async overrideSubmission(
    submissionId: string,
    dto: { submissionData?: Record<string, any>; xpEarned?: number },
  ) {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ["student"],
    });

    if (!submission) {
      throw new NotFoundException("Submission not found");
    }

    const queryRunner = this.submissionRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let xpDelta = 0;

      // Update basic fields
      if (dto.submissionData) {
        submission.submissionData = dto.submissionData;
      }

      if (dto.xpEarned !== undefined) {
        xpDelta = dto.xpEarned - submission.xpEarned;
        submission.xpEarned = dto.xpEarned;
      }

      await queryRunner.manager.save(submission);

      // If XP changed, update the student's total XP
      if (xpDelta !== 0) {
        const student = await queryRunner.manager.findOne(Student, {
          where: { id: submission.studentId },
          lock: { mode: "pessimistic_write" },
        });

        if (student) {
          student.totalXp += xpDelta;

          // Recalculate level based on new XP
          const XP_PER_LEVEL = 500; // Same as in StudentPortalService, should probably be centralized
          student.currentLevel = Math.floor(student.totalXp / XP_PER_LEVEL) + 1;

          await queryRunner.manager.save(student);
        }
      }

      await queryRunner.commitTransaction();
      return submission;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reset Streaks (Admin)
   * Bulk reset the `currentStreak` for all students to 0.
   * Optionally filter by mosqueId or circleId.
   */
  async resetStreaks(filters?: { mosqueId?: string; circleId?: string }) {
    const qb = this.studentRepo.createQueryBuilder()
      .update(Student)
      .set({ currentStreak: 0 });

    if (filters?.circleId) {
      qb.where("circleId = :circleId", { circleId: filters.circleId });
    } else if (filters?.mosqueId) {
      qb.where("mosqueId = :mosqueId", { mosqueId: filters.mosqueId });
    }

    const result = await qb.execute();

    return {
      success: true,
      affected: result.affected || 0,
    };
  }
  async createCampaign(dto: Partial<Campaign>) {
    const campaign = this.submissionRepo.manager.create(Campaign, dto);
    
    // If setting to active, might want to deactivate others (simplified logic here)
    if (dto.isActive) {
      await this.submissionRepo.manager.update(Campaign, { isActive: true }, { isActive: false });
    }

    return this.submissionRepo.manager.save(campaign);
  }

  /**
   * Get Campaigns (Admin)
   */
  async getCampaigns() {
    return this.submissionRepo.manager.find(Campaign, {
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Update Campaign (Admin)
   */
  async updateCampaign(id: string, dto: Partial<Campaign>) {
    const campaign = await this.submissionRepo.manager.findOne(Campaign, { where: { id } });
    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    if (dto.isActive && !campaign.isActive) {
        await this.submissionRepo.manager.update(Campaign, { isActive: true }, { isActive: false });
    }

    Object.assign(campaign, dto);
    return this.submissionRepo.manager.save(campaign);
  }
}
