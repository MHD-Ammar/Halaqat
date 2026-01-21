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
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateStudentDto {
  @ApiProperty({
    description: "Student's full name",
    example: "Omar Abdullah",
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: "UUID of the circle to assign the student to",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  circleId!: string;

  @ApiPropertyOptional({
    description: "Parent's phone number",
    example: "+966501234567",
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: "Date of birth in ISO 8601 format",
    example: "2015-03-15",
  })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({
    description: "Home address",
    example: "123 Main Street, Riyadh",
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: "Medical or behavioral notes about the student",
    example: "Has difficulty with long vowels",
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: "Name of the guardian/parent",
    example: "Abdullah Mohammed",
  })
  @IsString()
  @IsOptional()
  guardianName?: string;

  @ApiPropertyOptional({
    description: "Guardian/parent phone number",
    example: "+966509876543",
  })
  @IsString()
  @IsOptional()
  guardianPhone?: string;
}
