/**
 * Sessions Service
 *
 * Business logic for managing daily sessions and attendance.
 * Features "Smart Initialization" - auto-creates attendance records for all students.
 */

import { AttendanceStatus, SessionStatus } from "@halaqat/types";
import { Injectable, NotFoundException } from "@nestjs/common";
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
  async findTodaySession(circleId: string): Promise<Session | null> {
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
  async createTodaySession(circleId: string): Promise<Session> {
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
          status: AttendanceStatus.PRESENT, // Default to PRESENT
        }),
      );

      await this.attendanceRepository.save(attendanceRecords);

      // Award initial points for the default PRESENT status
      const mosqueId = session.mosqueId;
      for (const record of attendanceRecords) {
        if (record.status === AttendanceStatus.PRESENT) {
          await this.pointsService.calculateAndAwardPoints(
            record.studentId,
            "ATTENDANCE_ON_TIME",
            mosqueId,
            session.id,
          );
        }
      }

      // Reload session with all relations to include new records
      return this.findOne(session.id);
    }

    return session;
  }

  /**
   * Get a session by ID with attendance records
   */
  async findOne(id: string): Promise<Session> {
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

    return session;
  }

  /**
   * Bulk update attendance records for a session
   */
  async updateBulkAttendance(
    sessionId: string,
    bulkDto: BulkAttendanceDto,
  ): Promise<Session> {
    // Verify session exists and get current state
    const session = await this.findOne(sessionId);

    // Map current attendances for easy lookup
    const attendanceMap = new Map(session.attendances.map((a) => [a.studentId, a]));

    // Process updates
    for (const update of bulkDto.updates) {
      const currentRecord = attendanceMap.get(update.studentId);

      // Only perform logic if status is actively changing
      if (currentRecord && currentRecord.status !== update.status) {
        const studentId = update.studentId;
        const mosqueId = session.mosqueId;


        // 1. Revert points for the OLD status
        const oldRuleKey = STATUS_TO_RULE_KEY[currentRecord.status];
        if (oldRuleKey) {
          await this.pointsService.calculateAndAwardPoints(
            studentId,
            oldRuleKey,
            mosqueId,
            sessionId,
            `Correction: Changed from ${currentRecord.status} to ${update.status}`,
            -1, // Revert points
          );
        }

        // 2. Award points for the NEW status
        const newRuleKey = STATUS_TO_RULE_KEY[update.status];
        if (newRuleKey) {
          await this.pointsService.calculateAndAwardPoints(
            studentId,
            newRuleKey,
            mosqueId,
            sessionId,
          );
        }
      }

      // Update the record in DB
      await this.attendanceRepository.update(
        { sessionId, studentId: update.studentId },
        { status: update.status },
      );
    }

    // Return updated session
    return this.findOne(sessionId);
  }

  /**
   * Get session history for a circle
   */
  async getSessionHistory(
    circleId: string,
    limit: number = 30,
  ): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { circleId },
      relations: ["attendances", "attendances.student"],
      order: { date: "DESC" },
      take: limit,
    });
  }

  /**
   * Close a session (mark as CLOSED)
   */
  async closeSession(id: string): Promise<Session> {
    const session = await this.findOne(id);
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
