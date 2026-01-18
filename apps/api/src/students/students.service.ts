/**
 * Students Service
 *
 * Business logic for managing students in study circles.
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";

import { Student } from "./entities/student.entity";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { StudentQueryDto } from "./dto/student-query.dto";
import { CirclesService } from "../circles/circles.service";

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    private circlesService: CirclesService,
  ) {}

  /**
   * Create a new student
   */
  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    // Verify circle exists
    await this.circlesService.findOne(createStudentDto.circleId);

    const student = this.studentsRepository.create(createStudentDto);
    return this.studentsRepository.save(student);
  }

  /**
   * Create a student with teacher ownership validation
   */
  async createForTeacher(
    createStudentDto: CreateStudentDto,
    teacherId: string,
  ): Promise<Student> {
    // Verify teacher owns the circle
    const isOwner = await this.circlesService.validateCircleOwnership(
      createStudentDto.circleId,
      teacherId,
    );

    if (!isOwner) {
      throw new ForbiddenException(
        "You do not have permission to add students to this circle",
      );
    }

    return this.create(createStudentDto);
  }

  /**
   * Get all students with pagination and filtering
   */
  async findAll(query: StudentQueryDto): Promise<PaginatedResult<Student>> {
    const { page = 1, limit = 20, search, circleId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = ILike(`%${search}%`);
    }

    if (circleId) {
      where.circleId = circleId;
    }

    const [data, total] = await this.studentsRepository.findAndCount({
      where,
      relations: ["circle"],
      order: { name: "ASC" },
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
   * Get students by circle ID (sorted alphabetically)
   */
  async findByCircle(circleId: string): Promise<Student[]> {
    return this.studentsRepository.find({
      where: { circleId },
      order: { name: "ASC" },
    });
  }

  /**
   * Get students without a circle assignment (unassigned)
   * Optionally filter by search term
   */
  async findUnassigned(search?: string): Promise<Student[]> {
    const queryBuilder = this.studentsRepository
      .createQueryBuilder("student")
      .where("student.circleId IS NULL")
      .orderBy("student.name", "ASC")
      .take(50);

    if (search && search.trim()) {
      queryBuilder.andWhere("student.name ILIKE :search", {
        search: `%${search.trim()}%`,
      });
    }

    return queryBuilder.getMany();
  }

  /**
   * Get a single student by ID
   */
  async findOne(id: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({
      where: { id },
      relations: ["circle"],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  /**
   * Search students by name (case-insensitive)
   */
  async searchByName(term: string): Promise<Student[]> {
    return this.studentsRepository.find({
      where: { name: ILike(`%${term}%`) },
      relations: ["circle"],
      order: { name: "ASC" },
      take: 20,
    });
  }

  /**
   * Update a student
   */
  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);

    // If circleId is being updated, verify the new circle exists
    if (updateStudentDto.circleId) {
      await this.circlesService.findOne(updateStudentDto.circleId);
    }

    Object.assign(student, updateStudentDto);
    return this.studentsRepository.save(student);
  }

  /**
   * Soft delete a student
   */
  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.studentsRepository.softRemove(student);
  }

  /**
   * Get student count for a circle
   */
  async countByCircle(circleId: string): Promise<number> {
    return this.studentsRepository.count({
      where: { circleId },
    });
  }

  /**
   * Get comprehensive student profile with aggregated stats
   */
  async getStudentProfile(id: string): Promise<{
    student: Student;
    stats: {
      attendanceRate: number;
      totalRecitations: number;
      totalPoints: number;
    };
    recentActivity: any[];
    pointsHistory: any[];
    attendanceHistory: any[];
  }> {
    const student = await this.findOne(id);

    // Parallel queries for all aggregated data
    const [attendanceData, recitations, pointsHistory] = await Promise.all([
      // Attendance stats
      this.studentsRepository.manager
        .createQueryBuilder()
        .select("COUNT(*)", "total")
        .addSelect(
          "SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END)",
          "present"
        )
        .from("attendance", "a")
        .where("a.student_id = :studentId", { studentId: id })
        .getRawOne(),

      // Recent recitations (last 10)
      this.studentsRepository.manager
        .createQueryBuilder()
        .select([
          'r.id as "id"',
          'r.type as "type"',
          'r.quality as "quality"',
          'r.page_number as "pageNumber"',
          'r.created_at as "createdAt"',
        ])
        .from("recitation", "r")
        .where("r.student_id = :studentId", { studentId: id })
        .orderBy("r.created_at", "DESC")
        .limit(10)
        .getRawMany(),

      // Points history (last 10)
      this.studentsRepository.manager
        .createQueryBuilder()
        .select([
          'pt.id as "id"',
          'pt.amount as "amount"',
          'pt.reason as "reason"',
          'pt.source_type as "sourceType"',
          'pt.created_at as "createdAt"',
        ])
        .from("point_transaction", "pt")
        .where("pt.student_id = :studentId", { studentId: id })
        .orderBy("pt.created_at", "DESC")
        .limit(10)
        .getRawMany(),
    ]);

    // Attendance history (last 20)
    const attendanceHistory = await this.studentsRepository.manager
      .createQueryBuilder()
      .select([
        'a.id as "id"',
        'a.status as "status"',
        'a.created_at as "createdAt"',
        'sess.date as "sessionDate"',
      ])
      .from("attendance", "a")
      .leftJoin("session", "sess", "sess.id = a.session_id")
      .where("a.student_id = :studentId", { studentId: id })
      .orderBy("sess.date", "DESC")
      .limit(20)
      .getRawMany();

    // Calculate stats
    const totalAttendances = parseInt(attendanceData?.total || "0", 10);
    const presentCount = parseInt(attendanceData?.present || "0", 10);
    const attendanceRate =
      totalAttendances > 0
        ? Math.round((presentCount / totalAttendances) * 100)
        : 0;

    return {
      student,
      stats: {
        attendanceRate,
        totalRecitations: recitations.length,
        totalPoints: student.totalPoints,
      },
      recentActivity: recitations,
      pointsHistory,
      attendanceHistory,
    };
  }
}

