
import "reflect-metadata"; // Required for class-transformer/validator
import { Type, plainToInstance } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { validate } from "class-validator";

// Mock the enum locally
enum ExamQuestionType {
  CURRENT_PART = "CURRENT_PART",
  CUMULATIVE = "CUMULATIVE",
}

// Inlined DTOs
class ExamQuestionDto {
  @IsEnum(ExamQuestionType)
  type!: ExamQuestionType;

  @IsOptional()
  @IsString()
  questionText?: string;

  @IsInt()
  @Min(0)
  mistakesCount!: number;

  @IsInt()
  @Min(1)
  maxScore!: number;
}

class SubmitExamDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamQuestionDto)
  questions!: ExamQuestionDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  passed?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(30, { each: true })
  testedParts?: number[];
}

async function testValidation() {
  const payload = {
    questions: [
      {
        type: "CURRENT_PART",
        mistakesCount: 0,
        maxScore: 100,
        questionText: "Test Ques"
      },
      {
        type: "CUMULATIVE",
        mistakesCount: 1,
        maxScore: 100,
        questionText: ""
      }
    ],
    score: 99.5,
    notes: "Notes",
    passed: true,
    testedParts: [1, 2]
  };

  console.log("Testing payload:", JSON.stringify(payload, null, 2));

  try {
    const dtoObject = plainToInstance(SubmitExamDto, payload);
    const errors = await validate(dtoObject);

    if (errors.length > 0) {
      console.log("Validation FAILED:");
      // Deep log errors
      console.log(JSON.stringify(errors, null, 2));
    } else {
      console.log("Validation PASSED!");
    }
  } catch (err) {
    console.error("Error during validation:", err);
  }
}

testValidation();
