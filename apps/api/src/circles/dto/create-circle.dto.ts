/**
 * Create Circle DTO
 *
 * Data transfer object for creating a new circle.
 */

import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from "class-validator";
import { Gender } from "@halaqat/types";

export class CreateCircleDto {
  /**
   * Circle name (required)
   */
  @IsString()
  @IsNotEmpty()
  name!: string;

  /**
   * Optional description
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Optional location within the mosque
   */
  @IsString()
  @IsOptional()
  location?: string;

  /**
   * Gender for the circle (required)
   */
  @IsEnum(Gender)
  @IsNotEmpty()
  gender!: Gender;

  /**
   * ID of the teacher to assign (required)
   */
  @IsUUID()
  @IsNotEmpty()
  teacherId!: string;
}
