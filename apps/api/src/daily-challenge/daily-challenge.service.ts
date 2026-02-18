import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { SubmitDailyChallengeDto } from "./dto/submit-daily-challenge.dto";
import { DailySubmission } from "./entities/daily-submission.entity";
import { getCampaignConfig, CampaignConfig, QuestionConfig } from "./form-config.registry";
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
   * Submit daily challenge
   */
  async submit(dto: SubmitDailyChallengeDto) {
    const { campaignKey = "ramadan" } = dto;
    const config = getCampaignConfig(campaignKey);

    if (!config) {
        throw new BadRequestException("Invalid campaign key");
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
        campaignKey,
      },
    });

    if (existing) {
      throw new BadRequestException("You have already submitted for today!");
    }

    // Calculate XP
    const xpEarned = this.calculateXP(dto.submissionData, config);

    // Calculate Streak
    const streak = await this.calculateStreak(dto.studentId, today, campaignKey);

    // Create Submission
    const submission = this.submissionRepo.create({
      studentId: dto.studentId,
      mosqueId: student.mosqueId,
      submissionDate: today,
      submissionData: dto.submissionData,
      xpEarned,
      streak,
      campaignKey,
    });

    return this.submissionRepo.save(submission);
  }

  /**
   * Calculate XP based on form data and campaign config (generic)
   */
  private calculateXP(data: any, config: CampaignConfig): number {
    let totalXp = config.submitted_xp || 0;
    const questions = config.questions || {};

    for (const [key, qConfig] of Object.entries<QuestionConfig>(questions)) {
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
   * (If submitted yesterday, streak = yesterday's streak + 1. Else 1.)
   */
  private async calculateStreak(
    studentId: string,
    todayStr: string,
    campaignKey: string,
  ): Promise<number> {
    const yesterdayDate = new Date(todayStr);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

    const previousSubmission = await this.submissionRepo.findOne({
      where: {
        studentId,
        submissionDate: yesterdayStr,
        campaignKey,
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
   * Used for "Welcome back!" screen
   */
  async getStudentInfo(studentId: string, campaignKey: string = "ramadan") {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      select: ["id", "name"],
    });

    if (!student) throw new NotFoundException("Student not found");

    // Get last submission for this campaign
    const lastSubmission = await this.submissionRepo.findOne({
      where: { studentId, campaignKey },
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

      // If submitted today or yesterday, the streak is alive
      if (diffDays <= 1) {
        currentStreak = lastSubmission.streak;
      }

      // Check if already submitted today
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
   * Aggregates total XP per student for a specific campaign
   */
  async getLeaderboard(mosqueId: string, campaignKey: string = "ramadan") {
    // Top 50 students by total XP in this campaign
    const results = await this.submissionRepo
      .createQueryBuilder("submission")
      .select("submission.studentId", "studentId")
      .addSelect("SUM(submission.xpEarned)", "totalXp")
      .addSelect("MAX(submission.streak)", "maxStreak")
      .innerJoin("submission.student", "student")
      .addSelect("student.name", "name")
      .where("submission.mosqueId = :mosqueId", { mosqueId })
      .andWhere("submission.campaignKey = :campaignKey", { campaignKey })
      .groupBy("submission.studentId")
      .addGroupBy("student.name")
      .orderBy("SUM(submission.xpEarned)", "DESC")
      .limit(50)
      .getRawMany();

    return results.map((r) => ({
      studentId: r.studentId,
      name: r.name,
      totalXp: Number(r.totalXp),
      streak: Number(r.maxStreak), 
    }));
  }

  /**
   * Get Weekly Submissions for a Circle (Teacher View)
   */
  async getWeeklySubmissions(
    circleId: string,
    startDateStr: string,
    campaignKey: string = "ramadan",
  ) {
    // 1. Get all students in circle
    const students = await this.studentRepo.find({
      where: { circleId },
      select: ["id", "name"],
      order: { name: "ASC" },
    });

    if (!students.length) {
      return [];
    }

    // 2. Calculate date range (start date + 6 days)
    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const endDateStr = endDate.toISOString().split("T")[0];

    // 3. Fetch submissions for these students in range
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
      .andWhere("submission.campaignKey = :campaignKey", { campaignKey })
      .andWhere("submission.submissionDate >= :startDate", {
        startDate: startDateStr,
      })
      .andWhere("submission.submissionDate <= :endDate", { endDate: endDateStr })
      .getMany();

    // 4. Map results
    // Output: [ { studentId, name, submissions: { '2024-03-10': { ... }, ... } } ]
    return students.map((student) => {
      const studentSubmissions: Record<string, any> = {};

      // Fill submissions map
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
      details: submission.submissionData, // The raw JSON form data
    };
  }
}
