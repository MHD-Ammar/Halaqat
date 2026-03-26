/**
 * Submit Student Quest DTO
 *
 * Payload for submitting daily quests with form data
 */
import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class SubmitStudentQuestDto {
  /**
   * The submission form data (varies by campaign)
   * e.g., { prayers: { fajr: 'mosque' }, quran: 5, tasks: true }
   */
  @IsObject()
  @IsNotEmpty()
  submissionData!: Record<string, unknown>;

  /**
   * Campaign UUID - links DailySubmission to the correct campaign.
   * If not provided, uses the currently active campaign.
   */
  @IsString()
  @IsOptional()
  campaignId?: string;

  /**
   * Local date string (YYYY-MM-DD) for handling timezones
   * If not provided, server uses current UTC date
   */
  @IsString()
  @IsOptional()
  localDate?: string;
}
