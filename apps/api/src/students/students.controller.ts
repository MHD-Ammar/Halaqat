/**
 * Students Controller
 *
 * REST API endpoints for managing students.
 */

import { UserRole } from "@halaqat/types";
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
  ForbiddenException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";

import { BulkCreateStudentsDto } from "./dto/bulk-create-students.dto";
import { CreateStudentDto } from "./dto/create-student.dto";
import { StudentQueryDto } from "./dto/student-query.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { StudentsService } from "./students.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@ApiTags("Students")
@ApiBearerAuth("JWT-auth")
@Controller("students")
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /**
   * Create a new student
   * POST /api/students
   * Teachers can only add to their own circles
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: "Create student",
    description:
      "Create a new student. Teachers can only add to their circles.",
  })
  @ApiResponse({ status: 201, description: "Student created successfully" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({
    status: 403,
    description: "Teacher cannot add to this circle",
  })
  create(
    @Body() createStudentDto: CreateStudentDto,
    @CurrentUser() user: { id: string; role: UserRole; mosqueId?: string },
  ) {
    // Admins can create for any circle, teachers only for their own
    if (user.role === UserRole.ADMIN) {
      return this.studentsService.create(createStudentDto, user.mosqueId);
    }
    return this.studentsService.createForTeacher(
      createStudentDto,
      user.id,
      user.mosqueId,
    );
  }

  /**
   * Bulk create students from an array of names
   * POST /api/students/bulk
   * Teachers can only add to their own circles
   */
  @Post("bulk")
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: "Bulk create students",
    description:
      "Create multiple students from an array of names. Teachers can only add to their circles.",
  })
  @ApiResponse({
    status: 201,
    description: "Students created successfully",
    schema: {
      properties: {
        created: { type: "array", items: { type: "object" } },
        count: { type: "number", example: 5 },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({
    status: 403,
    description: "Teacher cannot add to this circle",
  })
  bulkCreate(
    @Body() bulkCreateDto: BulkCreateStudentsDto,
    @CurrentUser() user: { id: string; role: UserRole; mosqueId?: string },
  ) {
    // Admins can create for any circle, teachers only for their own
    if (user.role === UserRole.ADMIN) {
      return this.studentsService.bulkCreate(
        bulkCreateDto.circleId,
        bulkCreateDto.names,
        user.mosqueId,
      );
    }
    return this.studentsService.bulkCreateForTeacher(
      bulkCreateDto.circleId,
      bulkCreateDto.names,
      user.id,
      user.mosqueId,
    );
  }

  /**
   * Get all students with pagination (Admin only)
   * GET /api/students
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.EXAMINER)
  @ApiOperation({
    summary: "List all students",
    description: "Get paginated list of all students (scoped to mosque)",
  })
  @ApiResponse({ status: 200, description: "Paginated list of students" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  findAll(
    @Query() query: StudentQueryDto,
    @CurrentUser() user: { id: string; role: UserRole; mosqueId?: string },
  ) {
    // If teacher, pass teacherId to filter results
    const teacherId = user.role === UserRole.TEACHER ? user.id : undefined;
    return this.studentsService.findAll(query, user.mosqueId, teacherId);
  }

  /**
   * Search students by name
   * GET /api/students/search?term=...
   */
  @Get("search")
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.EXAMINER)
  @ApiOperation({
    summary: "Search students",
    description: "Search students by name (case-insensitive)",
  })
  @ApiQuery({ name: "term", required: false, description: "Search term" })
  @ApiResponse({ status: 200, description: "Search results" })
  search(@Query("term") term: string) {
    return this.studentsService.searchByName(term || "");
  }

  /**
   * Get unassigned students (no circle)
   * GET /api/students/unassigned?search=...
   */
  @Get("unassigned")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Get unassigned students",
    description: "Get students not assigned to any circle (Admin only)",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Optional search filter",
  })
  @ApiResponse({ status: 200, description: "List of unassigned students" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  findUnassigned(@Query("search") search?: string) {
    return this.studentsService.findUnassigned(search);
  }

  /**
   * Get students for a specific circle
   * GET /api/students/by-circle/:circleId
   */
  @Get("by-circle/:circleId")
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.EXAMINER)
  @ApiOperation({
    summary: "Get students by circle",
    description: "Get all students in a specific circle",
  })
  @ApiParam({ name: "circleId", description: "Circle UUID" })
  @ApiResponse({ status: 200, description: "List of students in the circle" })
  findByCircle(@Param("circleId", ParseUUIDPipe) circleId: string) {
    return this.studentsService.findByCircle(circleId);
  }

  /**
   * Get comprehensive student profile with stats
   * GET /api/students/:id/profile
   */
  @Get(":id/profile")
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.EXAMINER, UserRole.STUDENT)
  @ApiOperation({
    summary: "Get student profile",
    description:
      "Get comprehensive student profile with stats. Students may only read their own profile.",
  })
  @ApiParam({ name: "id", description: "Student UUID" })
  @ApiResponse({ status: 200, description: "Student profile with stats" })
  @ApiResponse({ status: 403, description: "A student requested another student's profile" })
  @ApiResponse({ status: 404, description: "Student not found" })
  getProfile(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    // A STUDENT may only read their own profile; their JWT `id` is the
    // student id. Anyone else (admin/teacher/examiner) keeps full access.
    if (user.role === UserRole.STUDENT && user.id !== id) {
      throw new ForbiddenException(
        "You do not have permission to view this student",
      );
    }
    const teacherId = user.role === UserRole.TEACHER ? user.id : undefined;
    return this.studentsService.getStudentProfile(id, teacherId);
  }

  /**
   * Get a single student by ID
   * GET /api/students/:id
   */
  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.EXAMINER)
  @ApiOperation({
    summary: "Get student by ID",
    description: "Get a single student's details",
  })
  @ApiParam({ name: "id", description: "Student UUID" })
  @ApiResponse({ status: 200, description: "Student details" })
  @ApiResponse({ status: 404, description: "Student not found" })
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const teacherId = user.role === UserRole.TEACHER ? user.id : undefined;
    return this.studentsService.findOne(id, teacherId);
  }

  /**
   * Update a student
   * PATCH /api/students/:id
   */
  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: "Update student",
    description: "Update student details",
  })
  @ApiParam({ name: "id", description: "Student UUID" })
  @ApiResponse({ status: 200, description: "Student updated successfully" })
  @ApiResponse({ status: 404, description: "Student not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const teacherId = user.role === UserRole.TEACHER ? user.id : undefined;
    return this.studentsService.update(id, updateStudentDto, teacherId);
  }

  /**
   * Soft delete a student
   * DELETE /api/students/:id
   */
  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Delete student",
    description: "Soft delete a student",
  })
  @ApiParam({ name: "id", description: "Student UUID" })
  @ApiResponse({ status: 200, description: "Student deleted successfully" })
  @ApiResponse({ status: 404, description: "Student not found" })
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    const teacherId = user.role === UserRole.TEACHER ? user.id : undefined;
    return this.studentsService.remove(id, teacherId);
  }

  /**
   * Generate/reset login credentials for a student
   * POST /api/students/:id/generate-credentials
   */
  @Post(":id/generate-credentials")
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: "Generate student credentials",
    description:
      "Generate or reset login credentials for a student (Admin/Teacher only). Returns the raw password once.",
  })
  @ApiParam({ name: "id", description: "Student UUID" })
  @ApiResponse({
    status: 201,
    description: "Credentials generated successfully",
    schema: {
      properties: {
        username: { type: "string", example: "ahmad8492" },
        password: { type: "string", example: "K9M2XA" },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Student not found" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - requires ADMIN or TEACHER role",
  })
  generateCredentials(@Param("id", ParseUUIDPipe) id: string) {
    return this.studentsService.generateCredentials(id);
  }
}
