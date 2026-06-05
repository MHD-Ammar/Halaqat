/**
 * Analytics Service
 *
 * Provides aggregated statistics for the Admin/Supervisor dashboard
 * and teacher-specific dashboard with date range support.
 */

import { AttendanceStatus } from "@halaqat/types";
import { Injectable, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual, Between } from "typeorm";

import { Circle } from "../circles/entities/circle.entity";
import { PointTransaction } from "../points/entities/point-transaction.entity";
import { Recitation } from "../progress/entities/recitation.entity";
import { Session } from "../sessions/entities/session.entity";
import { Student } from "../students/entities/student.entity";
import { User } from "../users/entities/user.entity";

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

interface RawPointsResult {
  studentId: string;
  totalPoints: string;
}

interface RawPagesResult {
  studentId: string;
  pages: string;
}

interface RawCountResult {
  sessionId: string;
  count: string;
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
    @InjectRepository(Recitation)
    private readonly recitationRepository: Repository<Recitation>,
  ) {}

  /**
   * Get daily overview statistics
   *
   * BUG FIX: The original code used `new Date(); today.setHours(0,0,0,0)` which
   * produces a timestamp in SERVER-LOCAL time.  In a multi-tenant deployment
   * different mosques may be in different timezones, producing wrong counts.
   * We now use a UTC midnight boundary for session/point queries so the result
   * is stable regardless of server timezone.  A future enhancement could read
   * `Mosque.timezone` and apply a proper offset.
   */
  async getDailyOverview(mosqueId?: string | null): Promise<DailyOverview> {
    // Use UTC midnight to avoid server-timezone drift across mosque timezones
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

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
    today.setUTCHours(0, 0, 0, 0);

    // Get circles belonging to this teacher
    // Security: Verify mosqueId if provided
    const where: Record<string, unknown> = { teacherId };
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
    const teacherWhere: Record<string, unknown> = { role: "TEACHER" };
    if (mosqueId) {
      teacherWhere.mosqueId = mosqueId;
    }

    const teachers = await this.userRepository.find({
      where: teacherWhere,
      order: { fullName: "ASC" },
    });

    // 2. Get all circles with relationships to map them to teachers
    const circleWhere: Record<string, unknown> = {};
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
    today.setUTCHours(0, 0, 0, 0);

    // Base case: Teacher stats (existing logic)
    if (role.toUpperCase() === "TEACHER") {
      return this.getTeacherStats(userId, mosqueId || undefined);
    }

    // Admin: Mosque-wide stats
    if (role === "ADMIN" || role === "SUPERVISOR") {
      const whereClause: Record<string, unknown> = {};
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

  /**
   * Get comprehensive teacher dashboard data for a date range
   */
  async getTeacherDashboard(
    teacherId: string,
    mosqueId: string | undefined,
    from: Date,
    to: Date,
  ) {
    // Get circles belonging to this teacher
    const where: Record<string, unknown> = { teacherId };
    if (mosqueId) {
      where.mosqueId = mosqueId;
    }

    const teacherCircles = await this.circleRepository.find({
      where,
      relations: ["students"],
    });

    const circleIds = teacherCircles.map((c) => c.id);
    const studentIds = teacherCircles.flatMap(
      (c) => c.students?.map((s) => s.id) || [],
    );
    const totalStudents = studentIds.length;

    if (circleIds.length === 0) {
      return {
        totalStudents: 0,
        totalSessions: 0,
        averageAttendanceRate: 0,
        totalRecitations: 0,
        totalPagesRecited: 0,
        totalPointsAwarded: 0,
        attendanceTrend: [],
        topStudents: [],
        recentSessions: [],
      };
    }

    // Fetch sessions in date range for teacher's circles
    const sessions = await this.sessionRepository.find({
      where: circleIds.map((circleId) => ({
        circleId,
        date: Between(from, to),
      })),
      relations: ["attendances"],
      order: { date: "DESC" },
    });

    const totalSessions = sessions.length;
    const sessionIds = sessions.map((s) => s.id);

    // --- Attendance trend (grouped by date) ---
    const attendanceByDate: Record<
      string,
      { present: number; absent: number; late: number; total: number }
    > = {};

    let totalPresent = 0;
    let totalAttendanceRecords = 0;

    for (const session of sessions) {
      const dateStr: string =
        session.date instanceof Date
          ? (session.date.toISOString().split("T")[0] ?? "")
          : String(session.date);

      if (!attendanceByDate[dateStr]) {
        attendanceByDate[dateStr] = { present: 0, absent: 0, late: 0, total: 0 };
      }

      for (const att of session.attendances || []) {
        attendanceByDate[dateStr].total++;
        totalAttendanceRecords++;

        if (att.status === AttendanceStatus.PRESENT) {
          attendanceByDate[dateStr].present++;
          totalPresent++;
        } else if (att.status === AttendanceStatus.ABSENT) {
          attendanceByDate[dateStr].absent++;
        } else if (att.status === AttendanceStatus.LATE) {
          attendanceByDate[dateStr].late++;
          totalPresent++; // late counts as present for rate
        }
      }
    }

    const averageAttendanceRate =
      totalAttendanceRecords > 0
        ? Math.round((totalPresent / totalAttendanceRecords) * 100)
        : 0;

    const attendanceTrend = Object.entries(attendanceByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Recitations ---
    let totalRecitations = 0;
    let totalPagesRecited = 0;

    if (sessionIds.length > 0) {
      const recitationResult = await this.recitationRepository
        .createQueryBuilder("r")
        .select("COUNT(*)", "count")
        .addSelect("COUNT(DISTINCT r.pageNumber)", "pages")
        .where("r.sessionId IN (:...sessionIds)", { sessionIds })
        .getRawOne();

      totalRecitations = parseInt(recitationResult?.count || "0", 10);
      totalPagesRecited = parseInt(recitationResult?.pages || "0", 10);
    }

    // --- Points awarded ---
    let totalPointsAwarded = 0;
    if (studentIds.length > 0) {
      const pointsResult = await this.pointTransactionRepository
        .createQueryBuilder("pt")
        .select("COALESCE(SUM(pt.amount), 0)", "total")
        .where("pt.createdAt >= :from", { from })
        .andWhere("pt.createdAt <= :toEnd", {
          toEnd: new Date(to.getTime() + 24 * 60 * 60 * 1000),
        })
        .andWhere("pt.studentId IN (:...studentIds)", { studentIds })
        .getRawOne();

      totalPointsAwarded = parseInt(pointsResult?.total || "0", 10);
    }

    // --- Top students by points ---
    let topStudents: Array<{
      studentId: string;
      studentName: string;
      totalPoints: number;
      totalPages: number;
      attendanceRate: number;
    }> = [];

    if (studentIds.length > 0) {
      // Get points per student
      const pointsByStudent: RawPointsResult[] = await this.pointTransactionRepository
        .createQueryBuilder("pt")
        .select("pt.studentId", "studentId")
        .addSelect("COALESCE(SUM(pt.amount), 0)", "totalPoints")
        .where("pt.createdAt >= :from", { from })
        .andWhere("pt.createdAt <= :toEnd", {
          toEnd: new Date(to.getTime() + 24 * 60 * 60 * 1000),
        })
        .andWhere("pt.studentId IN (:...studentIds)", { studentIds })
        .groupBy("pt.studentId")
        .orderBy('"totalPoints"', "DESC")
        .limit(5)
        .getRawMany();

      // Build student map for names
      const allStudents = teacherCircles.flatMap((c) => c.students || []);
      const studentMap = new Map(allStudents.map((s) => [s.id, s.name]));

      // Calculate attendance per student
      const studentAttendance: Record<
        string,
        { present: number; total: number }
      > = {};
      for (const session of sessions) {
        for (const att of session.attendances || []) {
          const sid = att.studentId;
          if (!studentAttendance[sid]) {
            studentAttendance[sid] = { present: 0, total: 0 };
          }
          const record = studentAttendance[sid];
          record.total++;
          if (
            att.status === AttendanceStatus.PRESENT ||
            att.status === AttendanceStatus.LATE
          ) {
            record.present++;
          }
        }
      }

      // Get pages per student
      let pagesByStudent: Record<string, number> = {};
      if (sessionIds.length > 0) {
        const pagesResult: RawPagesResult[] = await this.recitationRepository
          .createQueryBuilder("r")
          .select("r.studentId", "studentId")
          .addSelect("COUNT(DISTINCT r.pageNumber)", "pages")
          .where("r.sessionId IN (:...sessionIds)", { sessionIds })
          .groupBy("r.studentId")
          .getRawMany();

        pagesByStudent = Object.fromEntries(
          pagesResult.map((r) => [r.studentId, parseInt(r.pages || "0", 10)]),
        );
      }

      topStudents = pointsByStudent.map((row) => {
        const sa = studentAttendance[row.studentId];
        return {
          studentId: row.studentId,
          studentName: studentMap.get(row.studentId) || "Unknown",
          totalPoints: parseInt(row.totalPoints || "0", 10),
          totalPages: pagesByStudent[row.studentId] || 0,
          attendanceRate: sa
            ? Math.round((sa.present / sa.total) * 100)
            : 0,
        };
      });
    }

    // --- Recent sessions ---
    const recentSessions = sessions.slice(0, 5).map((s) => {
      let presentCount = 0;
      let absentCount = 0;
      for (const att of s.attendances || []) {
        if (
          att.status === AttendanceStatus.PRESENT ||
          att.status === AttendanceStatus.LATE
        ) {
          presentCount++;
        } else {
          absentCount++;
        }
      }

      return {
        id: s.id,
        date:
          s.date instanceof Date
            ? (s.date.toISOString().split("T")[0] ?? "")
            : String(s.date),
        presentCount,
        absentCount,
        recitationCount: 0, // Will be enriched below
      };
    });

    // Enrich recent sessions with recitation counts
    if (recentSessions.length > 0) {
      const recentIds = recentSessions.map((s) => s.id);
      const recitationCounts: RawCountResult[] = await this.recitationRepository
        .createQueryBuilder("r")
        .select("r.sessionId", "sessionId")
        .addSelect("COUNT(*)", "count")
        .where("r.sessionId IN (:...recentIds)", { recentIds })
        .groupBy("r.sessionId")
        .getRawMany();

      const countMap = new Map(
        recitationCounts.map((r) => [
          r.sessionId,
          parseInt(r.count || "0", 10),
        ]),
      );

      for (const rs of recentSessions) {
        rs.recitationCount = countMap.get(rs.id) || 0;
      }
    }

    return {
      totalStudents,
      totalSessions,
      averageAttendanceRate,
      totalRecitations,
      totalPagesRecited,
      totalPointsAwarded,
      attendanceTrend,
      topStudents,
      recentSessions,
    };
  }
}

export type { DailyOverview, TeacherPerformance };
