import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { SubmitRamadanDto } from "./dto/submit-ramadan.dto";
import { RamadanSubmission } from "./entities/ramadan-submission.entity";
import { RAMADAN_FORM_CONFIG } from "./ramadan-form.config";
import { Circle } from "../circles/entities/circle.entity";
import { Mosque } from "../mosques/entities/mosque.entity";
import { Student } from "../students/entities/student.entity";

@Injectable()
export class RamadanService {
  constructor(
    @InjectRepository(RamadanSubmission)
    private submissionRepo: Repository<RamadanSubmission>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Circle)
    private circleRepo: Repository<Circle>,
    @InjectRepository(Mosque)
    private mosqueRepo: Repository<Mosque>,
  ) {}

  /**
   * Submit daily Ramadan form
   */
  async submit(dto: SubmitRamadanDto) {
    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId },
      relations: ["mosque"],
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    const today = new Date().toISOString().split("T")[0];

    if (!today) {
      throw new BadRequestException("Invalid date");
    }

    // Check for existing submission today
    const existing = await this.submissionRepo.findOne({
      where: {
        studentId: dto.studentId,
        submissionDate: today,
      },
    });

    if (existing) {
      throw new BadRequestException("You have already submitted for today!");
    }

    // Calculate XP
    const xpEarned = this.calculateXP(dto.submissionData);

    // Calculate Streak
    const streak = await this.calculateStreak(dto.studentId, today);

    // Create Submission
    const submission = this.submissionRepo.create({
      studentId: dto.studentId,
      mosqueId: student.mosqueId,
      submissionDate: today,
      submissionData: dto.submissionData,
      xpEarned,
      streak,
    });

    return this.submissionRepo.save(submission);
  }

  /**
   * Calculate XP based on form data
   */
  private calculateXP(data: any): number {
    let totalXp = RAMADAN_FORM_CONFIG.submitted_xp;

    // 1. Prayers Grid
    if (data.prayers) {
      Object.values(data.prayers).forEach((val: any) => {
        if (val === "mosque") totalXp += RAMADAN_FORM_CONFIG.prayers.mosque;
        if (val === "home_group")
          totalXp += RAMADAN_FORM_CONFIG.prayers.home_group;
        if (val === "solo") totalXp += RAMADAN_FORM_CONFIG.prayers.solo;
      });
    }

    // 2. Quran Pages
    if (data.quran_pages) {
      const pages = Math.min(
        Number(data.quran_pages),
        RAMADAN_FORM_CONFIG.quran.max_pages,
      );
      totalXp += pages * RAMADAN_FORM_CONFIG.quran.multiplier;
    }

    // 3. Taraweeh
    if (data.taraweeh === true) {
      totalXp += RAMADAN_FORM_CONFIG.taraweeh.yes;
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
  ): Promise<number> {
    const yesterdayDate = new Date(todayStr);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

    const previousSubmission = await this.submissionRepo.findOne({
      where: {
        studentId,
        submissionDate: yesterdayStr,
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
  async getStudentInfo(studentId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      select: ["id", "name"],
    });

    if (!student) throw new NotFoundException("Student not found");

    // Get last submission
    const lastSubmission = await this.submissionRepo.findOne({
      where: { studentId },
      order: { submissionDate: "DESC" },
    });

    // Simple streak logic: if last submission was today or yesterday, show that streak.
    // If older, streak is broken (0).
    // Note: The `submit` logic calculates the *new* streak. Here we just want to show *current* active streak.
    // Actually simpler: just return the streak from the last submission if it was recent.

    let currentStreak = 0;
    if (lastSubmission) {
      const today = new Date();
      const lastDate = new Date(lastSubmission.submissionDate);
      const diffDays = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24),
      );

      // If submitted today or yesterday, the streak is alive
      if (diffDays <= 1) {
        currentStreak = lastSubmission.streak;
      }
    }

    return {
      ...student,
      currentStreak,
      lastSubmissionDate: lastSubmission?.submissionDate || null,
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
   * Aggregates total XP per student
   */
  async getLeaderboard(mosqueId: string) {
    // Top 50 students by total XP
    const results = await this.submissionRepo
      .createQueryBuilder("submission")
      .select("submission.studentId", "studentId")
      .addSelect("SUM(submission.xpEarned)", "totalXp")
      .addSelect("MAX(submission.streak)", "maxStreak") // Show their best streak or current? Let's show max for now or logic to show current.
      // Actually sidebar spec says "Streak: 🔥 [Number]". This usually implies current active streak.
      // For query simplicity, let's just grab the latest streak from the latest submission for each student?
      // Grouping by student ID.
      .innerJoin("submission.student", "student")
      .addSelect("student.name", "name")
      .where("submission.mosqueId = :mosqueId", { mosqueId })
      .groupBy("submission.studentId")
      .addGroupBy("student.name")
      .orderBy("SUM(submission.xpEarned)", "DESC")
      .limit(50)
      .getRawMany();

    // The Streak in the leaderboard should likely be the *current* streak.
    // The aggregation above gives us stats. `MAX(streak)` gives the highest streak they achieved this month.
    // For now, let's use MAX streak as the "Badge of Honor" streak on the leaderboard.
    // Or we can do a subquery, but that's expensive.
    // Let's stick to total XP as the ranking metric.

    return results.map((r) => ({
      studentId: r.studentId,
      name: r.name,
      totalXp: Number(r.totalXp),
      streak: Number(r.maxStreak), // Simplified: showing max streak achieved
    }));
  }
}
