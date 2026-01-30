import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { SubmitExamDto } from "./src/exams/dto/submit-exam.dto";

// Mock the enum locally
enum ExamQuestionType {
  CURRENT_PART = "CURRENT_PART",
  CUMULATIVE = "CUMULATIVE",
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

  const dtoObject = plainToInstance(SubmitExamDto, payload);
  const errors = await validate(dtoObject);

  if (errors.length > 0) {
    console.log("Validation failed:", JSON.stringify(errors, null, 2));
  } else {
    console.log("Validation passed!");
  }
}

testValidation();
