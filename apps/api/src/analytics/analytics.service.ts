/**
 * Analytics Service
 *
 * Provides aggregated statistics for the Admin/Supervisor dashboard.
 */

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";

import { Student } from "../students/entities/student.entity";
import { Session } from "../sessions/entities/session.entity";
import { PointTransaction } from "../points/entities/point-transaction.entity";
import { Circle } from "../circles/entities/circle.entity";
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
  ) {}

  /**
   * Get daily overview statistics
   */
  async getDailyOverview(): Promise<DailyOverview> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total active students
    const totalStudents = await this.studentRepository.count({
      where: { deletedAt: undefined },
    });

    // Today's sessions
    const todaySessions = await this.sessionRepository.find({
      where: {
        date: MoreThanOrEqual(today),
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
    const pointsResult = await this.pointTransactionRepository
      .createQueryBuilder("pt")
      .select("COALESCE(SUM(pt.amount), 0)", "total")
      .where("pt.createdAt >= :today", { today })
      .getRawOne();

    const pointsAwardedToday = parseInt(pointsResult?.total || "0", 10);

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
  async getTeacherStats(teacherId: string): Promise<DailyOverview> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get circles belonging to this teacher
    const teacherCircles = await this.circleRepository.find({
      where: { teacherId },
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
      0
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
      (c) => c.students?.map((s) => s.id) || []
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
  async getTeacherPerformance(): Promise<TeacherPerformance[]> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Get all circles with their teachers and latest session
    const circles = await this.circleRepository.find({
      relations: ["teacher", "students"],
    });

    const result: TeacherPerformance[] = [];

    for (const circle of circles) {
      if (!circle.teacher) continue;

      // Get the most recent session for this circle
      const lastSession = await this.sessionRepository.findOne({
        where: { circleId: circle.id },
        order: { date: "DESC" },
      });

      const lastSessionDate = lastSession?.date || null;
      const isActive = lastSessionDate
        ? new Date(lastSessionDate) >= threeDaysAgo
        : false;

      result.push({
        teacherId: circle.teacher.id,
        teacherName: circle.teacher.fullName,
        circleName: circle.name,
        studentCount: circle.students?.length || 0,
        lastSessionDate,
        isActive,
      });
    }

    return result;
  }
}

export type { DailyOverview, TeacherPerformance };
