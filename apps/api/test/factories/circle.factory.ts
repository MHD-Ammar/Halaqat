import { faker } from "@faker-js/faker/locale/ar";
import { Repository } from "typeorm";

import { Circle } from "../../src/circles/entities/circle.entity";

export function buildCircle(overrides: Partial<Circle> = {}): Partial<Circle> {
  return {
    name: `حلقة ${faker.word.noun()}`,
    gender: "MALE",
    ...overrides,
  };
}

export async function createCircle(
  repo: Repository<Circle>,
  overrides: Partial<Circle> = {},
): Promise<Circle> {
  return repo.save(repo.create(buildCircle(overrides)));
}

