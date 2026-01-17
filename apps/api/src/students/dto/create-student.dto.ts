/**
 * Create Student DTO
 *
 * Data transfer object for creating a new student.
 * Designed for quick creation - only name and circleId are required.
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
} from "class-validator";

export class CreateStudentDto {
  /**
   * Student's full name (required)
   */
  @IsString()
  @IsNotEmpty()
  name!: string;

  /**
   * Circle ID to assign the student to (required)
   */
  @IsUUID()
  @IsNotEmpty()
  circleId!: string;

  /**
   * Parent's phone number (optional)
   */
  @IsString()
  @IsOptional()
  phone?: string;

  /**
   * Date of birth (optional)
   */
  @IsDateString()
  @IsOptional()
  dob?: string;

  /**
   * Address (optional)
   */
  @IsString()
  @IsOptional()
  address?: string;

  /**
   * Medical or behavioral notes (optional)
   */
  @IsString()
  @IsOptional()
  notes?: string;
}
