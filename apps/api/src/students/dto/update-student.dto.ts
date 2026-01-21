/**
 * Update Student DTO
 *
 * Partial type of CreateStudentDto for updates.
 * Uses @nestjs/swagger PartialType for proper OpenAPI schema inheritance.
 */

import { PartialType } from "@nestjs/swagger";
import { CreateStudentDto } from "./create-student.dto";

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}
