import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsObject, IsUUID } from "class-validator";

export class SubmitRamadanDto {
  @ApiProperty({
    description: "Student ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

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
  submissionData!: Record<string, any>;
}
