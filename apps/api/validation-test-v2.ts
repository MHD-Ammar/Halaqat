
import "reflect-metadata"; // Required for class-transformer/validator
import { plainToInstance } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { validate } from "class-validator";

// --- CreateExamDto (Copied) ---
class CreateExamDto {
  @IsUUID()
  studentId!: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsInt()
  @Min(1)
  @Max(30)
  juzNumber!: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(30, { each: true })
  testedParts?: number[];
}

// --- Test Logic ---
async function testValidation() {
  console.log("--- Testing CreateExamDto ---");
  
  // Payload mimicking Frontend
  const payload = {
    studentId: "123e4567-e89b-12d3-a456-426614174000", // Valid UUID
    date: new Date().toISOString(),
    notes: "",
    juzNumber: 1, // Number
    testedParts: [1] // Number array
  };

  console.log("Testing payload:", JSON.stringify(payload, null, 2));

  try {
    const dtoObject = plainToInstance(CreateExamDto, payload);
    const errors = await validate(dtoObject);

    if (errors.length > 0) {
      console.log("Validation FAILED:");
      console.log(JSON.stringify(errors, null, 2));
    } else {
      console.log("Validation PASSED!");
    }
  } catch (err) {
    console.error("Error during validation:", err);
  }
}

testValidation();
