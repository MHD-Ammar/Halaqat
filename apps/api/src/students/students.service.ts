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
}
