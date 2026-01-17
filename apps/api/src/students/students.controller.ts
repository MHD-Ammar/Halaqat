/**
 * Students Controller
 *
 * REST API endpoints for managing students.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import { UserRole } from "@halaqat/types";

import { StudentsService } from "./students.service";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { StudentQueryDto } from "./dto/student-query.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("students")
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /**
   * Create a new student
   * POST /api/students
   * Teachers can only add to their own circles
   */
  @Post()
  create(
    @Body() createStudentDto: CreateStudentDto,
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    // Admins can create for any circle, teachers only for their own
    if (user.role === UserRole.ADMIN) {
      return this.studentsService.create(createStudentDto);
    }
    return this.studentsService.createForTeacher(createStudentDto, user.sub);
  }

  /**
   * Get all students with pagination (Admin only)
   * GET /api/students
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(@Query() query: StudentQueryDto) {
    return this.studentsService.findAll(query);
  }

  /**
   * Search students by name
   * GET /api/students/search?term=...
   */
  @Get("search")
  search(@Query("term") term: string) {
    return this.studentsService.searchByName(term || "");
  }

  /**
   * Get unassigned students (no circle)
   * GET /api/students/unassigned?search=...
   */
  @Get("unassigned")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findUnassigned(@Query("search") search?: string) {
    return this.studentsService.findUnassigned(search);
  }

  /**
   * Get students for a specific circle
   * GET /api/students/by-circle/:circleId
   */
  @Get("by-circle/:circleId")
  findByCircle(@Param("circleId", ParseUUIDPipe) circleId: string) {
    return this.studentsService.findByCircle(circleId);
  }

  /**
   * Get comprehensive student profile with stats
   * GET /api/students/:id/profile
   */
  @Get(":id/profile")
  getProfile(@Param("id", ParseUUIDPipe) id: string) {
    return this.studentsService.getStudentProfile(id);
  }

  /**
   * Get a single student by ID
   * GET /api/students/:id
   */
  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.studentsService.findOne(id);
  }

  /**
   * Update a student
   * PATCH /api/students/:id
   */
  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, updateStudentDto);
  }

  /**
   * Soft delete a student
   * DELETE /api/students/:id
   */
  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.studentsService.remove(id);
  }
}

