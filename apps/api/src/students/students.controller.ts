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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { UserRole } from "@halaqat/types";

import { StudentsService } from "./students.service";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { StudentQueryDto } from "./dto/student-query.dto";
import { BulkCreateStudentsDto } from "./dto/bulk-create-students.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Students")
@ApiBearerAuth("JWT-auth")
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
    @CurrentUser() user: { sub: string; role: UserRole; mosqueId?: string },
  ) {
    // Admins can create for any circle, teachers only for their own
    if (user.role === UserRole.ADMIN) {
      return this.studentsService.create(createStudentDto, user.mosqueId);
    }
    return this.studentsService.createForTeacher(
      createStudentDto,
      user.sub,
      user.mosqueId,
    );
  }

  /**
   * Bulk create students from an array of names
   * POST /api/students/bulk
   * Teachers can only add to their own circles
   */
  @Post("bulk")
  @UseGuards(RolesGuard)
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
    @CurrentUser() user: { sub: string; role: UserRole; mosqueId?: string },
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
      user.sub,
      user.mosqueId,
    );
  }

  /**
   * Get all students with pagination (Admin only)
   * GET /api/students
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.EXAMINER)
  @ApiOperation({
    summary: "List all students",
    description: "Get paginated list of all students (scoped to mosque)",
  })
  @ApiResponse({ status: 200, description: "Paginated list of students" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  findAll(
    @Query() query: StudentQueryDto,
    @CurrentUser() user: { sub: string; mosqueId?: string },
  ) {
    return this.studentsService.findAll(query, user.mosqueId);
  }

  /**
   * Search students by name
   * GET /api/students/search?term=...
   */
  @Get("search")
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
  @UseGuards(RolesGuard)
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
  @ApiOperation({
    summary: "Get student profile",
    description: "Get comprehensive student profile with stats",
  })
  @ApiParam({ name: "id", description: "Student UUID" })
  @ApiResponse({ status: 200, description: "Student profile with stats" })
  @ApiResponse({ status: 404, description: "Student not found" })
  getProfile(@Param("id", ParseUUIDPipe) id: string) {
    return this.studentsService.getStudentProfile(id);
  }

  /**
   * Get a single student by ID
   * GET /api/students/:id
   */
  @Get(":id")
  @ApiOperation({
    summary: "Get student by ID",
    description: "Get a single student's details",
  })
  @ApiParam({ name: "id", description: "Student UUID" })
  @ApiResponse({ status: 200, description: "Student details" })
  @ApiResponse({ status: 404, description: "Student not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.studentsService.findOne(id);
  }

  /**
   * Update a student
   * PATCH /api/students/:id
   */
  @Patch(":id")
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
  ) {
    return this.studentsService.update(id, updateStudentDto);
  }

  /**
   * Soft delete a student
   * DELETE /api/students/:id
   */
  @Delete(":id")
  @ApiOperation({
    summary: "Delete student",
    description: "Soft delete a student",
  })
  @ApiParam({ name: "id", description: "Student UUID" })
  @ApiResponse({ status: 200, description: "Student deleted successfully" })
  @ApiResponse({ status: 404, description: "Student not found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.studentsService.remove(id);
  }

  /**
   * Generate login credentials for a student
   * POST /api/students/:id/credentials
   */
  @Post(":id/credentials")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: "Generate student credentials",
    description:
      "Create login credentials for a student to access their portal (Admin/Teacher only)",
  })
  @ApiParam({ name: "id", description: "Student UUID" })
  @ApiResponse({
    status: 201,
    description: "Credentials generated successfully",
    schema: {
      properties: {
        username: { type: "string", example: "student_abc12345" },
        password: { type: "string", example: "Xk7mP2nQ" },
        userId: { type: "string", format: "uuid" },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Student not found" })
  @ApiResponse({ status: 409, description: "Student already has credentials" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - requires ADMIN or TEACHER role",
  })
  generateCredentials(@Param("id", ParseUUIDPipe) id: string) {
    return this.studentsService.generateCredentials(id);
  }
}
