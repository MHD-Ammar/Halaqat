/**
 * Sessions Service
 *
 * Business logic for managing daily sessions and attendance.
 * Features "Smart Initialization" - auto-creates attendance records for all students.
 */

import { AttendanceStatus, SessionStatus } from "@halaqat/types";
import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { BulkAttendanceDto } from "./dto/bulk-attendance.dto";
import { Attendance } from "./entities/attendance.entity";
import { Session } from "./entities/session.entity";
import { CirclesService } from "../circles/circles.service";
import { PointsService } from "../points/points.service";
import { StudentsService } from "../students/students.service";



// Map statuses to their corresponding point rule keys
const STATUS_TO_RULE_KEY: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: "ATTENDANCE_ON_TIME",
  [AttendanceStatus.LATE]: "ATTENDANCE_LATE",
  [AttendanceStatus.ABSENT]: "ATTENDANCE_ABSENT",
  [AttendanceStatus.EXCUSED]: "ATTENDANCE_EXCUSED",
};

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    private studentsService: StudentsService,
    private circlesService: CirclesService,
    private pointsService: PointsService,
  ) {}

  /**
   * Find today's session for a circle (Read Only)
   * Returns null if no session exists.
   */
  async findTodaySession(circleId: string, teacherId?: string): Promise<Session | null> {
    if (teacherId) {
      const isOwner = await this.circlesService.validateCircleOwnership(circleId, teacherId);
      if (!isOwner) throw new ForbiddenException("You do not have access to this circle");
    }

    const today = this.getTodayDate();

    const session = await this.sessionRepository.findOne({
      where: {
        circleId,
        date: today,
      },
      relations: [
        "attendances",
        "attendances.student",
        "circle",
        "recitations",
        "pointTransactions",
      ],
    });

    if (session) {
      // Ensure all students have attendance records (auto-sync)
      return this.syncSessionAttendance(session);
    }

    return session;
  }

  /**
   * Explicitly create today's session for a circle
   * - Creates session if not exists
   * - Populates attendance for all students
   */
  async createTodaySession(circleId: string, teacherId?: string): Promise<Session> {
    if (teacherId) {
      const isOwner = await this.circlesService.validateCircleOwnership(circleId, teacherId);
      if (!isOwner) throw new ForbiddenException("You do not have access to this circle");
    }

    // Validate circle exists first
    const circle = await this.circlesService
      .findOne(circleId)
      .catch(() => null);
    if (!circle) {
      throw new NotFoundException(
        `Circle with ID "${circleId}" not found. Please verify the circle exists.`,
      );
    }

    const today = this.getTodayDate();

    // Check for existing session first to avoid duplicates
    let session = await this.sessionRepository.findOne({
      where: {
        circleId,
        date: today,
      },
      relations: ["attendances", "attendances.student", "circle"],
    });

    // If session doesn't exist, create it
    if (!session) {
      const newSession = new Session();
      newSession.circleId = circle.id;
      newSession.date = today;
      newSession.status = SessionStatus.OPEN;
      newSession.mosqueId = circle.mosqueId;

      session = await this.sessionRepository.save(newSession);
      // Initialize attendances collection
      session.attendances = [];
    }

    // Ensure attendance records exist
    return this.syncSessionAttendance(session);
  }

  /**
   * Helper to ensure all students in the circle have attendance records for the session
   */
  private async syncSessionAttendance(session: Session): Promise<Session> {
    // Fetch all active students in this circle
    const students = await this.studentsService.findByCircle(session.circleId);

    // Filter students who don't have attendance records yet for this session
    const existingStudentIds = new Set(
      session.attendances?.map((a) => a.studentId) || [],
    );
    const missingStudents = students.filter(
      (s) => !existingStudentIds.has(s.id),
    );

    if (missingStudents.length > 0) {
      // Create attendance records for missing students
      const attendanceRecords = missingStudents.map((student) =>
        this.attendanceRepository.create({
          sessionId: session.id,
          studentId: student.id,
          mosqueId: session.mosqueId,
          status: AttendanceStatus.PRESENT, // Default to PRESENT
        }),
      );

      await this.attendanceRepository.save(attendanceRecords);

      // Award initial points for the default PRESENT status
      const mosqueId = session.mosqueId;
      const bulkAwards: Array<{ studentId: string; ruleKey: string; reason?: string; multiplier?: number }> = [];

      for (const record of attendanceRecords) {
        if (record.status === AttendanceStatus.PRESENT) {
          bulkAwards.push({
            studentId: record.studentId,
            ruleKey: "ATTENDANCE_ON_TIME",
          });
        }
      }

      if (bulkAwards.length > 0) {
        await this.pointsService.calculateAndAwardPointsBulk(
          mosqueId,
          session.id,
          bulkAwards
        );
      }

      // Reload session with all relations to include new records
      return this.findOne(session.id);
    }

    return session;
  }

  /**
   * Get a session by ID with attendance records
   */
  async findOne(id: string, teacherId?: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: [
        "attendances",
        "attendances.student",
        "circle",
        "recitations",
        "pointTransactions",
      ],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    if (teacherId && session.circle?.teacherId !== teacherId) {
      throw new ForbiddenException("You do not have permission to view or manage this session");
    }

    return session;
  }

  /**
   * Bulk update attendance records for a session
   */
  async updateBulkAttendance(
    sessionId: string,
    bulkDto: BulkAttendanceDto,
    teacherId?: string,
  ): Promise<Session> {
    // Verify session exists and get current state
    const session = await this.findOne(sessionId, teacherId);

    // Map current attendances for easy lookup
    const attendanceMap = new Map(session.attendances.map((a) => [a.studentId, a]));

    // Process updates
    const bulkAwards: Array<{ studentId: string; ruleKey: string; reason?: string; multiplier?: number }> = [];

    for (const update of bulkDto.updates) {
      const currentRecord = attendanceMap.get(update.studentId);

      // Only perform logic if status is actively changing
      if (currentRecord && currentRecord.status !== update.status) {
        const studentId = update.studentId;

        // 1. Revert points for the OLD status
        const oldRuleKey = STATUS_TO_RULE_KEY[currentRecord.status];
        if (oldRuleKey) {
          bulkAwards.push({
            studentId,
            ruleKey: oldRuleKey,
            reason: `Correction: Changed from ${currentRecord.status} to ${update.status}`,
            multiplier: -1,
          });
        }

        // 2. Award points for the NEW status
        const newRuleKey = STATUS_TO_RULE_KEY[update.status];
        if (newRuleKey) {
          bulkAwards.push({
            studentId,
            ruleKey: newRuleKey,
          });
        }

        currentRecord.status = update.status;
      }
    }

    if (bulkAwards.length > 0) {
      await this.pointsService.calculateAndAwardPointsBulk(
        session.mosqueId,
        sessionId,
        bulkAwards
      );
    }

    // Update the records in DB
    const recordsToUpdate = bulkDto.updates
      .map(update => attendanceMap.get(update.studentId))
      .filter((record): record is Attendance => record !== undefined);

    if (recordsToUpdate.length > 0) {
      await this.attendanceRepository.save(recordsToUpdate);
    }

    // Return updated session
    return this.findOne(sessionId, teacherId);
  }

  /**
   * Get session history for a circle
   */
  async getSessionHistory(
    circleId: string,
    page: number = 1,
    limit: number = 30,
    teacherId?: string,
  ): Promise<{ data: Session[]; meta: { total: number; page: number; lastPage: number; limit: number } }> {
    if (teacherId) {
      const isOwner = await this.circlesService.validateCircleOwnership(circleId, teacherId);
      if (!isOwner) throw new ForbiddenException("You do not have access to this circle");
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.sessionRepository.findAndCount({
      where: { circleId },
      relations: ["attendances", "attendances.student"],
      order: { date: "DESC" },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  /**
   * Close a session (mark as CLOSED)
   */
  async closeSession(id: string, teacherId?: string): Promise<Session> {
    const session = await this.findOne(id, teacherId);
    session.status = SessionStatus.CLOSED;
    return this.sessionRepository.save(session);
  }

  /**
   * Get today's date (normalized to midnight)
   */
  private getTodayDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
