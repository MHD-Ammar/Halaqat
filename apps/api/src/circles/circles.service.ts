/**
 * Circles Service
 *
 * Business logic for managing study circles.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRole } from "@halaqat/types";

import { Circle } from "./entities/circle.entity";
import { CreateCircleDto } from "./dto/create-circle.dto";
import { UpdateCircleDto } from "./dto/update-circle.dto";
import { User } from "../users/entities/user.entity";
import { Student } from "../students/entities/student.entity";

@Injectable()
export class CirclesService {
  constructor(
    @InjectRepository(Circle)
    private circlesRepository: Repository<Circle>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  /**
   * Create a new circle and assign it to a teacher
   */
  async create(
    createCircleDto: CreateCircleDto,
    mosqueId?: string | null,
  ): Promise<Circle> {
    const { teacherId, ...circleData } = createCircleDto;

    // teacherId is required (controller sets it for teachers, admin must provide it)
    if (!teacherId) {
      throw new BadRequestException("Teacher ID is required");
    }

    // Verify teacher exists and has TEACHER role
    const teacher = await this.usersRepository.findOne({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    if (teacher.role !== UserRole.TEACHER) {
      throw new BadRequestException(
        `User with ID ${teacherId} is not a teacher`,
      );
    }

    const circle = new Circle();
    Object.assign(circle, circleData);
    circle.teacherId = teacherId;
    circle.mosqueId = (mosqueId || teacher.mosqueId) as string;

    if (!circle.mosqueId) {
      throw new BadRequestException(
        "Mosque ID is required for circle creation",
      );
    }

    return this.circlesRepository.save(circle);
  }

  /**
   * Get all circles with teacher information (tenancy-aware)
   */
  async findAll(mosqueId?: string | null): Promise<Circle[]> {
    const where: Record<string, string> = {};
    if (mosqueId) {
      where.mosqueId = mosqueId;
    }
    return this.circlesRepository.find({
      where,
      relations: ["teacher"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get a single circle by ID with teacher and students
   */
  async findOne(id: string): Promise<Circle> {
    const circle = await this.circlesRepository.findOne({
      where: { id },
      relations: ["teacher", "students"],
    });

    if (!circle) {
      throw new NotFoundException(`Circle with ID ${id} not found`);
    }

    return circle;
  }

  /**
   * Get circles assigned to a specific teacher
   */
  async findMyCircles(teacherId: string): Promise<Circle[]> {
    return this.circlesRepository.find({
      where: { teacherId },
      relations: ["teacher"],
      order: { name: "ASC" },
    });
  }

  /**
   * Update a circle
   */
  async update(id: string, updateCircleDto: UpdateCircleDto): Promise<Circle> {
    const circle = await this.findOne(id);

    // If teacherId is being updated, verify the new teacher
    if (updateCircleDto.teacherId) {
      const teacher = await this.usersRepository.findOne({
        where: { id: updateCircleDto.teacherId },
      });

      if (!teacher) {
        throw new NotFoundException(
          `Teacher with ID ${updateCircleDto.teacherId} not found`,
        );
      }

      if (teacher.role !== UserRole.TEACHER) {
        throw new BadRequestException(
          `User with ID ${updateCircleDto.teacherId} is not a teacher`,
        );
      }
    }

    Object.assign(circle, updateCircleDto);
    return this.circlesRepository.save(circle);
  }

  /**
   * Soft delete a circle
   * Prevents deletion if circle has dependent students
   */
  async remove(id: string): Promise<void> {
    // 1. Unassign all students belonging to this circle first
    await this.studentsRepository.update({ circleId: id }, { circleId: null });

    // 2. Fetch the circle without any relations for soft removal
    const circle = await this.circlesRepository.findOne({ where: { id } });

    if (!circle) {
      throw new NotFoundException(`Circle with ID ${id} not found`);
    }

    await this.circlesRepository.softRemove(circle);
  }

  /**
   * Validate that a circle belongs to a specific teacher
   * Useful for authorization checks
   */
  async validateCircleOwnership(
    circleId: string,
    teacherId: string,
  ): Promise<boolean> {
    const circle = await this.circlesRepository.findOne({
      where: { id: circleId, teacherId },
    });

    return !!circle;
  }
}
