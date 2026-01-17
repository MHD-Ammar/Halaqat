/**
 * Update Student DTO
 *
 * Partial type of CreateStudentDto for updates.
 */

import { PartialType } from "@nestjs/mapped-types";
import { CreateStudentDto } from "./create-student.dto";

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}
