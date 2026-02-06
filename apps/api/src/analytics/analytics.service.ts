/**
 * Analytics Service
 *
 * Provides aggregated statistics for the Admin/Supervisor dashboard.
 */

import { Injectable, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";

import { Student } from "../students/entities/student.entity";
import { Session } from "../sessions/entities/session.entity";
import { PointTransaction } from "../points/entities/point-transaction.entity";
import { Circle } from "../circles/entities/circle.entity";
import { User } from "../users/entities/user.entity";
import { AttendanceStatus } from "@halaqat/types";

interface DailyOverview {
  totalStudents: number;
  attendanceRate: number;
  pointsAwardedToday: number;
  activeCircles: number;
}

interface TeacherPerformance {
  teacherId: string;
  teacherName: string;
  circleName: string;
  studentCount: number;
  lastSessionDate: Date | null;
  isActive: boolean;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(PointTransaction)
    private readonly pointTransactionRepository: Repository<PointTransaction>,
    @InjectRepository(Circle)
    private readonly circleRepository: Repository<Circle>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get daily overview statistics
   */
  async getDailyOverview(mosqueId?: string | null): Promise<DailyOverview> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total active students (not soft-deleted)
    const totalStudents = await this.studentRepository.count({
      where: mosqueId ? { mosqueId } : {},
    });

    // Today's sessions
    const todaySessions = await this.sessionRepository.find({
      where: {
        date: MoreThanOrEqual(today),
        ...(mosqueId ? { mosqueId } : {}),
      },
      relations: ["attendances"],
    });

    // Calculate attendance rate
    let presentCount = 0;
    let totalAttendances = 0;

    for (const session of todaySessions) {
      for (const attendance of session.attendances || []) {
        totalAttendances++;
        if (attendance.status === AttendanceStatus.PRESENT) {
          presentCount++;
        }
      }
    }

    const attendanceRate =
      totalAttendances > 0
        ? Math.round((presentCount / totalAttendances) * 100)
        : 0;

    // Points awarded today
    let pointsAwardedToday = 0;
    try {
      const query = this.pointTransactionRepository
        .createQueryBuilder("pt")
        .select("COALESCE(SUM(pt.amount), 0)", "total")
        .where("pt.createdAt >= :today", { today });

      if (mosqueId) {
        query
          .innerJoin("pt.student", "student")
          .andWhere("student.mosqueId = :mosqueId", { mosqueId });
      }

      const pointsResult = await query.getRawOne();
      pointsAwardedToday = parseInt(pointsResult?.total || "0", 10);
    } catch {
      // If points table doesn't exist yet, default to 0
      pointsAwardedToday = 0;
    }

    // Active circles (have session today)
    const activeCircles = new Set(todaySessions.map((s) => s.circleId)).size;

    return {
      totalStudents,
      attendanceRate,
      pointsAwardedToday,
      activeCircles,
    };
  }

  /**
   * Get teacher-specific statistics for their circles only
   */
  async getTeacherStats(
    teacherId: string,
    mosqueId?: string,
  ): Promise<DailyOverview> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get circles belonging to this teacher
    // Security: Verify mosqueId if provided
    const where: any = { teacherId };
    if (mosqueId) {
      where.mosqueId = mosqueId;
    }

    const teacherCircles = await this.circleRepository.find({
      where,
      relations: ["students"],
    });

    const circleIds = teacherCircles.map((c) => c.id);

    if (circleIds.length === 0) {
      return {
        totalStudents: 0,
        attendanceRate: 0,
        pointsAwardedToday: 0,
        activeCircles: 0,
      };
    }

    // Total students in teacher's circles
    const totalStudents = teacherCircles.reduce(
      (sum, circle) => sum + (circle.students?.length || 0),
      0,
    );

    // Today's sessions for teacher's circles
    const todaySessions = await this.sessionRepository.find({
      where: circleIds.map((circleId) => ({
        circleId,
        date: MoreThanOrEqual(today),
      })),
      relations: ["attendances"],
    });

    // Calculate attendance rate
    let presentCount = 0;
    let totalAttendances = 0;

    for (const session of todaySessions) {
      for (const attendance of session.attendances || []) {
        totalAttendances++;
        if (attendance.status === AttendanceStatus.PRESENT) {
          presentCount++;
        }
      }
    }

    const attendanceRate =
      totalAttendances > 0
        ? Math.round((presentCount / totalAttendances) * 100)
        : 0;

    // Points awarded today for students in teacher's circles
    const studentIds = teacherCircles.flatMap(
      (c) => c.students?.map((s) => s.id) || [],
    );

    let pointsAwardedToday = 0;
    if (studentIds.length > 0) {
      const pointsResult = await this.pointTransactionRepository
        .createQueryBuilder("pt")
        .select("COALESCE(SUM(pt.amount), 0)", "total")
        .where("pt.createdAt >= :today", { today })
        .andWhere("pt.studentId IN (:...studentIds)", { studentIds })
        .getRawOne();

      pointsAwardedToday = parseInt(pointsResult?.total || "0", 10);
    }

    // Active circles (have session today)
    const activeCircles = new Set(todaySessions.map((s) => s.circleId)).size;

    return {
      totalStudents,
      attendanceRate,
      pointsAwardedToday,
      activeCircles,
    };
  }

  /**
   * Get teacher performance data
   */
  async getTeacherPerformance(
    mosqueId?: string,
  ): Promise<TeacherPerformance[]> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // 1. Get ALL teachers in the mosque
    const teacherWhere: any = { role: "TEACHER" };
    if (mosqueId) {
      teacherWhere.mosqueId = mosqueId;
    }

    const teachers = await this.userRepository.find({
      where: teacherWhere,
      order: { fullName: "ASC" },
    });

    // 2. Get all circles with relationships to map them to teachers
    const circleWhere: any = {};
    if (mosqueId) {
      circleWhere.mosqueId = mosqueId;
    }

    const circles = await this.circleRepository.find({
      where: circleWhere,
      relations: ["teacher", "students"],
    });

    // 3. Aggregate data per teacher
    const result: TeacherPerformance[] = [];

    for (const teacher of teachers) {
      // Find circles for this teacher
      const teacherCircles = circles.filter(
        (c) => c.teacher && c.teacher.id === teacher.id,
      );

      // Aggregate circle stats
      const circleNames = teacherCircles.map((c) => c.name).join(", ");
      const totalStudents = teacherCircles.reduce(
        (sum, c) => sum + (c.students?.length || 0),
        0,
      );

      // Find the most recent session across all circles
      let lastSessionDate: Date | null = null;
      let isActive = false;

      // We need to check sessions for these circles
      if (teacherCircles.length > 0) {
        const circleIds = teacherCircles.map((c) => c.id);
        try {
          // This query might be expensive if many circles, but usually a teacher has 1-3 circles
          // Optimized: Get just the absolute latest session for any of these circles
          const lastSession = await this.sessionRepository.findOne({
            where: circleIds.map((id) => ({ circleId: id })),
            order: { date: "DESC" },
          });

          if (lastSession) {
            lastSessionDate = lastSession.date;
            isActive =
              new Date(lastSessionDate) >= threeDaysAgo;
          }
        } catch {
          // Ignore errors
        }
      }

      result.push({
        teacherId: teacher.id,
        teacherName: teacher.fullName || "Unknown",
        circleName: circleNames || "No Circle",
        studentCount: totalStudents,
        lastSessionDate,
        isActive,
      });
    }

    return result;
  }

  /**
   * Get role-based overview statistics
   * - Admin: Mosque-wide stats (totalStudents, totalCircles)
   * - Teacher: Circle-specific stats (students in my circles)
   * - Examiner: Exam stats (students tested today, exams conducted)
   */
  async getRoleBasedOverview(
    userId: string,
    role: string,
    mosqueId?: string | null,
  ): Promise<DailyOverview & { totalCircles?: number; examsToday?: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Base case: Teacher stats (existing logic)
    if (role.toUpperCase() === "TEACHER") {
      return this.getTeacherStats(userId, mosqueId || undefined);
    }

    // Admin: Mosque-wide stats
    if (role === "ADMIN" || role === "SUPERVISOR") {
      const whereClause: any = {};
      if (mosqueId) {
        whereClause.mosqueId = mosqueId;
      }

      const [totalStudents, totalCircles] = await Promise.all([
        this.studentRepository.count({ where: whereClause }),
        this.circleRepository.count({ where: whereClause }),
      ]);

      // Get base overview and add mosque-specific counts
      const baseOverview = await this.getDailyOverview();
      return {
        ...baseOverview,
        totalStudents,
        totalCircles,
      };
    }

    // Examiner: Exam-focused stats
    if (role === "EXAMINER") {
      // Count exams conducted today by this examiner
      const examsToday = await this.sessionRepository.manager
        .createQueryBuilder()
        .select("COUNT(*)", "count")
        .from("exam", "e")
        .where("e.examiner_id = :userId", { userId })
        .andWhere("e.date >= :today", { today })
        .getRawOne();

      // Count unique students tested today
      const studentsTested = await this.sessionRepository.manager
        .createQueryBuilder()
        .select("COUNT(DISTINCT e.student_id)", "count")
        .from("exam", "e")
        .where("e.examiner_id = :userId", { userId })
        .andWhere("e.date >= :today", { today })
        .getRawOne();

      return {
        totalStudents: parseInt(studentsTested?.count || "0", 10),
        attendanceRate: 0,
        pointsAwardedToday: 0,
        activeCircles: 0,
        examsToday: parseInt(examsToday?.count || "0", 10),
      };
    }

    // Fallback: If role doesn't match any known type, access is denied
    throw new ForbiddenException("Invalid role for analytics access");
  }
}

export type { DailyOverview, TeacherPerformance };
