import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository, ILike } from "typeorm";

import { CreateStudentDto } from "./dto/create-student.dto";
import { StudentQueryDto } from "./dto/student-query.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { Student } from "./entities/student.entity";
import { CirclesService } from "../circles/circles.service";

const SALT_ROUNDS = 10;

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export interface GeneratedCredentials {
  username: string;
  password: string;
}

/**
 * Simple Arabic-to-English transliteration map for common first names.
 * Only used for username prefix generation — not a full transliteration.
 */
const ARABIC_TO_LATIN: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a',
  'ب': 'b', 'ت': 't', 'ث': 'th',
  'ج': 'j', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z',
  'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
  'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
  'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
  'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
  'ي': 'y', 'ى': 'a', 'ة': 'h', 'ء': 'a',
  'ئ': 'e', 'ؤ': 'o',
};

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    private circlesService: CirclesService,
  ) {}

  /**
   * Expose the repository for query builder access (e.g. auth service)
   */
  getRepository(): Repository<Student> {
    return this.studentsRepository;
  }

  // ── Credential Generation Helpers ──────────────────────────────

  /**
   * Transliterate an Arabic string to a simple Latin equivalent.
   * Non-Arabic characters pass through unchanged.
   */
  private transliterate(text: string): string {
    return text
      .split("")
      .map((char) => ARABIC_TO_LATIN[char] ?? char)
      .join("");
  }

  /**
   * Generate a username prefix from a student's name.
   * Takes the first word, transliterates if Arabic, lowercases, strips non-alphanumeric.
   * Falls back to "stu" if the result is empty.
   */
  private generateUsernamePrefix(name: string): string {
    const firstName = name.trim().split(/\s+/)[0] || "stu";
    const transliterated = this.transliterate(firstName).toLowerCase();
    const cleaned = transliterated.replace(/[^a-z0-9]/g, "");
    return cleaned || "stu";
  }

  /**
   * Generate a random 4-digit number string (0000–9999).
   */
  private randomDigits(length: number): string {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }

  /**
   * Generate a 6-character alphanumeric password (uppercase + digits).
   * Characters I, O, 0, 1 are excluded to avoid confusion for kids.
   */
  private generatePassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let password = "";
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Generate a unique username + raw password for a student.
   * Retries up to 10 times if the generated username already exists.
   */
  private async generateStudentCredentials(
    name: string,
  ): Promise<{ username: string; rawPassword: string }> {
    const prefix = this.generateUsernamePrefix(name);
    const rawPassword = this.generatePassword();

    let attempts = 0;
    while (attempts < 10) {
      const username = `${prefix}${this.randomDigits(4)}`;
      const existing = await this.studentsRepository.findOne({
        where: { username },
        select: ["id"],
      });
      if (!existing) {
        return { username, rawPassword };
      }
      attempts++;
    }

    // Extremely unlikely fallback: use prefix + 6 digits
    const fallbackUsername = `${prefix}${this.randomDigits(6)}`;
    return { username: fallbackUsername, rawPassword };
  }

  // ── CRUD Operations ────────────────────────────────────────────

  /**
   * Create a new student with auto-generated credentials (Admin flow)
   */
  async create(
    createStudentDto: CreateStudentDto,
    mosqueId?: string | null,
  ): Promise<Student & { rawPassword: string }> {
    // Verify circle exists
    await this.circlesService.findOne(createStudentDto.circleId);

    // Generate credentials
    const { username, rawPassword } = await this.generateStudentCredentials(
      createStudentDto.name,
    );
    const passwordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);

    const student = new Student();
    Object.assign(student, createStudentDto);
    if (mosqueId) {
      student.mosqueId = mosqueId;
    }
    student.username = username;
    student.passwordHash = passwordHash;

    const saved = await this.studentsRepository.save(student);

    // Return raw password once (not persisted in plaintext)
    return { ...saved, rawPassword };
  }

  /**
   * Create a student with teacher ownership validation
   */
  async createForTeacher(
    createStudentDto: CreateStudentDto,
    teacherId: string,
    mosqueId?: string | null,
  ): Promise<Student & { rawPassword: string }> {
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

    return this.create(createStudentDto, mosqueId);
  }

  /**
   * Bulk create students from an array of names (Admin flow)
   * Returns each student with their one-time raw password.
   */
  async bulkCreate(
    circleId: string,
    names: string[],
    mosqueId?: string | null,
  ): Promise<{ created: (Student & { rawPassword: string })[]; count: number }> {
    // Verify circle exists and get mosqueId
    const circle = await this.circlesService.findOne(circleId);
    const effectiveMosqueId = mosqueId || circle.mosqueId;

    const studentsToSave: Student[] = [];
    const passwordsToReturn: string[] = [];

    for (const name of names) {
      const trimmedName = name.trim();
      if (!trimmedName) continue; // Skip empty names

      // Generate credentials for each student
      const { username, rawPassword } =
        await this.generateStudentCredentials(trimmedName);
      const passwordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);

      const student = new Student();
      student.name = trimmedName;
      student.circleId = circleId;
      student.mosqueId = effectiveMosqueId;
      student.username = username;
      student.passwordHash = passwordHash;

      studentsToSave.push(student);
      passwordsToReturn.push(rawPassword);
    }

    const savedStudents = await this.studentsRepository.save(studentsToSave);

    const results = savedStudents.map((saved, index) => ({
      ...saved,
      rawPassword: passwordsToReturn[index] as string,
    }));

    return {
      created: results,
      count: results.length,
    };
  }

  /**
   * Bulk create students with teacher ownership validation
   */
  async bulkCreateForTeacher(
    circleId: string,
    names: string[],
    teacherId: string,
    mosqueId?: string | null,
  ): Promise<{ created: (Student & { rawPassword: string })[]; count: number }> {
    // Verify teacher owns the circle
    const isOwner = await this.circlesService.validateCircleOwnership(
      circleId,
      teacherId,
    );

    if (!isOwner) {
      throw new ForbiddenException(
        "You do not have permission to add students to this circle",
      );
    }

    return this.bulkCreate(circleId, names, mosqueId);
  }

  /**
   * Get all students with pagination and filtering (tenancy-aware)
   */
  async findAll(
    query: StudentQueryDto,
    mosqueId?: string | null,
    teacherId?: string,
  ): Promise<PaginatedResult<Student>> {
    const { page = 1, limit = 20, search, circleId } = query;
    const skip = (page - 1) * limit;

    try {
      // Use QueryBuilder for flexibility with joins and filtering
      const qb = this.studentsRepository.createQueryBuilder("student")
        .leftJoinAndSelect("student.circle", "circle")
        .where("1=1"); // Base condition

      // Tenancy filter
      if (mosqueId) {
        qb.andWhere("student.mosque_id = :mosqueId", { mosqueId });
      }

      // Search filter
      if (search) {
        qb.andWhere("student.name ILIKE :search", { search: `%${search}%` });
      }

      // Circle filter
      if (circleId) {
        qb.andWhere("student.circle_id = :circleId", { circleId });
      }

      // Teacher filter (if provided)
      if (teacherId) {
        qb.andWhere("circle.teacherId = :teacherId", { teacherId });
      }

      // Ordering and Pagination
      qb.orderBy("student.name", "ASC")
        .skip(skip)
        .take(limit);

      const [data, total] = await qb.getManyAndCount();

      return {
        data,
        meta: {
          total,
          page,
          lastPage: Math.ceil(total / limit),
          limit,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        "Failed to fetch students. Please try again.",
      );
    }
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
  async findOne(id: string, teacherId?: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({
      where: { id },
      relations: ["circle"],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    // If teacherId provided, verify ownership
    if (teacherId && student.circle?.teacherId !== teacherId) {
      throw new ForbiddenException("You do not have permission to view this student");
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
  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
    teacherId?: string,
  ): Promise<Student> {
    const student = await this.findOne(id, teacherId);

    // If circleId is being updated, verify the new circle exists and belongs to the teacher
    if (updateStudentDto.circleId) {
      const circle = await this.circlesService.findOne(updateStudentDto.circleId);
      if (teacherId && circle.teacherId !== teacherId) {
        throw new ForbiddenException("Cannot move student to a circle you do not own");
      }
    }

    Object.assign(student, updateStudentDto);
    return this.studentsRepository.save(student);
  }

  /**
   * Soft delete a student
   */
  async remove(id: string, teacherId?: string): Promise<void> {
    const student = await this.findOne(id, teacherId);
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
  async getStudentProfile(id: string, teacherId?: string): Promise<{
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
    const student = await this.findOne(id, teacherId);

    // Parallel queries for all aggregated data
    const [attendanceData, recitations, pointsHistory] = await Promise.all([
      // Attendance stats
      this.studentsRepository.manager
        .createQueryBuilder()
        .select("COUNT(*)", "total")
        .addSelect(
          "SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END)",
          "present",
        )
        .from("attendance", "a")
        .where("a.student_id = :studentId", { studentId: id })
        .getRawOne(),

      // Recent recitations (last 10) with surah names
      this.studentsRepository.manager
        .createQueryBuilder()
        .select([
          'r.id as "id"',
          'r.type as "type"',
          'r.quality as "quality"',
          'r.page_number as "pageNumber"',
          's.name_english as "surahName"',
          's.name_arabic as "surahNameArabic"',
          'r.created_at as "createdAt"',
        ])
        .from("recitation", "r")
        .leftJoin("surah", "s", "s.id = r.surah_id")
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

  /**
   * Generate/reset login credentials for a student.
   * Hashes password directly on the Student entity.
   * Returns the raw credentials to the teacher (one-time visibility).
   */
  async generateCredentials(studentId: string): Promise<GeneratedCredentials> {
    const student = await this.findOne(studentId);

    // Generate new credentials
    const { username, rawPassword } =
      await this.generateStudentCredentials(student.name);
    const passwordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);

    // Update student with new credentials
    student.username = username;
    student.passwordHash = passwordHash;
    await this.studentsRepository.save(student);

    return {
      username,
      password: rawPassword,
    };
  }
}

