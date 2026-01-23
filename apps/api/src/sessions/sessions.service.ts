/**
 * Sessions Service
 *
 * Business logic for managing daily sessions and attendance.
 * Features "Smart Initialization" - auto-creates attendance records for all students.
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AttendanceStatus, SessionStatus } from "@halaqat/types";

import { Session } from "./entities/session.entity";
import { Attendance } from "./entities/attendance.entity";
import { BulkAttendanceDto } from "./dto/bulk-attendance.dto";
import { StudentsService } from "../students/students.service";
import { CirclesService } from "../circles/circles.service";

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    private studentsService: StudentsService,
    private circlesService: CirclesService,
  ) {}

  /**
   * Smart find or create today's session for a circle
   * - If session exists: return it with attendance records
   * - If not: create session + auto-populate attendance for all students
   */
  async findOrCreateTodaySession(circleId: string): Promise<Session> {
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

    // Check for existing session
    let session = await this.sessionRepository.findOne({
      where: {
        circleId,
        date: today,
      },
      relations: ["attendances", "attendances.student", "circle"],
    });

    if (session) {
      return session;
    }

    // Create new session
    session = this.sessionRepository.create({
      circleId,
      date: today,
      status: SessionStatus.OPEN,
    });

    session = await this.sessionRepository.save(session);

    // Fetch all active students in this circle
    const students = await this.studentsService.findByCircle(circleId);

    // Create attendance records for each student
    const attendanceRecords = students.map((student) =>
      this.attendanceRepository.create({
        sessionId: session!.id,
        studentId: student.id,
        status: AttendanceStatus.PRESENT, // Default to PRESENT
      }),
    );

    if (attendanceRecords.length > 0) {
      await this.attendanceRepository.save(attendanceRecords);
    }

    // Reload session with all relations
    return this.sessionRepository.findOne({
      where: { id: session.id },
      relations: ["attendances", "attendances.student", "circle"],
    }) as Promise<Session>;
  }

  /**
   * Get a session by ID with attendance records
   */
  async findOne(id: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ["attendances", "attendances.student", "circle"],
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
    // Verify session exists
    await this.findOne(sessionId);

    // Update each attendance record
    for (const update of bulkDto.updates) {
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
