/**
 * Add Manual Points DTO
 *
 * Data transfer object for adding manual points with budget constraints.
 */

import { IsUUID, IsInt, IsString, IsNotEmpty, Min, Max } from "class-validator";

export class AddManualPointsDto {
  /**
   * ID of the student receiving points
   */
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  /**
   * Point amount (positive for reward, negative for penalty)
   */
  @IsInt()
  @Min(-10)
  @Max(10)
  amount!: number;

  /**
   * Reason for the points
   */
  @IsString()
  @IsNotEmpty()
  reason!: string;

  /**
   * Session ID for budget tracking
   */
  @IsUUID()
  @IsNotEmpty()
  sessionId!: string;
}
