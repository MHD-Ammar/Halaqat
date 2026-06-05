import { faker } from "@faker-js/faker/locale/ar";
import { Repository } from "typeorm";

import { Student } from "../../src/students/entities/student.entity";

export function buildStudent(overrides: Partial<Student> = {}): Partial<Student> {
  return {
    name: faker.person.fullName(),
    totalXp: 0,
    totalPoints: 0,
    currentLevel: 1,
    currentStreak: 0,
    maxStreak: 0,
    ...overrides,
  };
}

export async function createStudent(
  repo: Repository<Student>,
  overrides: Partial<Student> = {},
): Promise<Student> {
  return repo.save(repo.create(buildStudent(overrides)));
}

