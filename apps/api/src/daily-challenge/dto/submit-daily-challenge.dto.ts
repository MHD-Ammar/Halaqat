import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsObject, IsString, IsUUID, IsOptional } from "class-validator";

export class SubmitDailyChallengeDto {
  @ApiProperty({
    description: "Student ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({
    description: "Campaign Key (e.g. 'ramadan') - fallback if campaignId not provided",
    example: "ramadan",
    required: false,
  })
  @IsString()
  @IsOptional()
  campaignKey?: string;

  @ApiProperty({
    description: "Campaign UUID - preferred over campaignKey when available",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  campaignId?: string;

  @ApiProperty({
    description: "Client Local Date (YYYY-MM-DD)",
    example: "2026-03-10",
    required: false,
  })
  @IsString()
  @IsOptional()
  localDate?: string;

  @ApiProperty({
    description: "Form submission data (JSON)",
    example: {
      prayers: { fajr: "mosque", dhuhr: "home_group" },
      quran_pages: 5,
      taraweeh: true,
    },
  })
  @IsObject()
  @IsNotEmpty()
  submissionData!: Record<string, unknown>;
}
